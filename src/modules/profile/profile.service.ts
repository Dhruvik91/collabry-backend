import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Profile } from '../../database/entities/profile.entity';
import { User } from '../../database/entities/user.entity';
import { InfluencerProfile } from '../../database/entities/influencer-profile.entity';
import { Auction } from '../../database/entities/auction.entity';
import { Collaboration } from '../../database/entities/collaboration.entity';
import { AuctionStatus, CollaborationStatus, UserStatus } from '../../database/entities/enums';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SaveProfileDto } from './dto/save-profile.dto';
import { SearchProfilesDto } from './dto/search-profiles.dto';
import { isEntityNotFoundError } from '../../database/errors/entity-not-found.type-guard';
import { cif } from '../../database/errors/tryQuery';

@Injectable()
export class ProfileService {
    constructor(
        @InjectRepository(Profile)
        private readonly profileRepo: Repository<Profile>,
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        @InjectRepository(InfluencerProfile)
        private readonly influencerRepo: Repository<InfluencerProfile>,
        @InjectRepository(Auction)
        private readonly auctionRepo: Repository<Auction>,
        @InjectRepository(Collaboration)
        private readonly collaborationRepo: Repository<Collaboration>,
        private readonly dataSource: DataSource,
    ) { }

    async getProfile(userId: string): Promise<Profile> {
        try {
            const profile = await this.profileRepo.findOne({
                where: { user: { id: userId } },
                relations: ['user'],
            });

            if (!profile) {
                throw new NotFoundException('Profile not found');
            }

            return profile;
        } catch (error) {
            cif(isEntityNotFoundError, new NotFoundException('Profile not found'))(error);
        }
    }

    async saveProfile(userId: string, saveDto: SaveProfileDto): Promise<Profile> {
        if (saveDto.username) {
            const existingProfile = await this.profileRepo.findOne({
                where: { username: saveDto.username },
                relations: ['user'],
            });

            if (existingProfile && existingProfile.user.id !== userId) {
                throw new ConflictException('Username already taken');
            }
        }

        let profile = await this.profileRepo.findOne({
            where: { user: { id: userId } },
        });

        if (!profile) {
            profile = this.profileRepo.create({
                user: { id: userId } as any,
                ...saveDto,
            });
        } else {
            Object.assign(profile, saveDto);
        }

        return await this.profileRepo.save(profile);
    }

    async updateProfile(userId: string, updateDto: UpdateProfileDto): Promise<Profile> {
        return this.saveProfile(userId, updateDto as SaveProfileDto);
    }

    async searchProfiles(searchDto: SearchProfilesDto) {
        const { name, username, location, role, page, limit } = searchDto;
        const query = this.profileRepo.createQueryBuilder('profile')
            .leftJoinAndSelect('profile.user', 'user')
            .where('user.status = :userStatus', { userStatus: UserStatus.ACTIVE });

        if (name) {
            query.andWhere('profile.fullName ILIKE :name', { name: `%${name}%` });
        }

        if (username) {
            query.andWhere('profile.username ILIKE :username', { username: `%${username}%` });
        }

        if (location) {
            query.andWhere('profile.location ILIKE :location', { location: `%${location}%` });
        }

        if (role) {
            query.andWhere('user.role = :role', { role });
        }

        // Add subqueries for counts
        query.addSelect((subQuery) => {
            return subQuery
                .select('COUNT(auction.id)', 'count')
                .from(Auction, 'auction')
                .where('auction.creatorId = user.id');
        }, 'totalAuctions');

        query.addSelect((subQuery) => {
            return subQuery
                .select('COUNT(collaboration.id)', 'count')
                .from(Collaboration, 'collaboration')
                .where('collaboration.requesterId = user.id')
                .andWhere('collaboration.status = :collabStatus', { collabStatus: CollaborationStatus.COMPLETED });
        }, 'completedCollaborations');

        const { entities, raw } = await query
            .skip((page - 1) * limit)
            .take(limit)
            .getRawAndEntities();

        const total = await query.getCount();

        const items = entities.map((profile, index) => {
            const rawItem = raw[index];
            return {
                ...profile,
                stats: {
                    totalAuctions: parseInt(rawItem.totalAuctions || '0'),
                    completedCollaborations: parseInt(rawItem.completedCollaborations || '0'),
                    activeAuctionsCount: 0, // We don't calculate this in list view for performance
                },
            };
        });

        return {
            items,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getProfileById(id: string): Promise<Profile> {
        try {
            const profile = await this.profileRepo.findOne({
                where: { id },
                relations: ['user'],
            });

            if (!profile) {
                throw new NotFoundException('Profile not found');
            }

            return profile;
        } catch (error) {
            cif(isEntityNotFoundError, new NotFoundException('Profile not found'))(error);
        }
    }

    async getBrandProfile(profileId: string) {
        const profile = await this.getProfileById(profileId);
        const userId = profile.user.id;

        const [totalAuctions, auctions, completedCollaborations] = await Promise.all([
            this.auctionRepo.count({ where: { creator: { id: userId } } }),
            this.auctionRepo.find({ 
                where: { creator: { id: userId } },
                order: { createdAt: 'DESC' },
                take: 50
            }),
            this.collaborationRepo.count({ 
                where: [
                    { requester: { id: userId }, status: CollaborationStatus.COMPLETED },
                ]
            })
        ]);

        return {
            ...profile,
            stats: {
                totalAuctions,
                activeAuctionsCount: auctions.filter(a => a.status === AuctionStatus.OPEN).length,
                completedCollaborations,
            },
            auctions,
        };
    }

    async updateStatus(userId: string, status: UserStatus) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        user.status = status;
        return await this.userRepo.save(user);
    }

    async deactivateAccount(userId: string) {
        return this.updateStatus(userId, UserStatus.INACTIVE);
    }

    async activateAccount(userId: string) {
        return this.updateStatus(userId, UserStatus.ACTIVE);
    }

    /**
     * Soft delete user, profile, and influencer profile
     */
    async deleteAccount(userId: string) {
        return await this.dataSource.transaction(async (manager) => {
            // Find all related entities
            const user = await manager.findOne(User, {
                where: { id: userId },
                relations: ['profile', 'influencerProfile']
            });

            if (!user) throw new NotFoundException('User not found');

            // Soft delete in order
            if (user.influencerProfile) {
                await manager.softRemove(InfluencerProfile, user.influencerProfile);
            }

            if (user.profile) {
                await manager.softRemove(Profile, user.profile);
            }

            return await manager.softRemove(User, user);
        });
    }
}
