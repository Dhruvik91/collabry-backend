import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InfluencerProfile } from '../../database/entities/influencer-profile.entity';
import { Collaboration } from '../../database/entities/collaboration.entity';
import { User } from '../../database/entities/user.entity';
import { UserRole, UserStatus, CollaborationStatus } from '../../database/entities/enums';
import { SaveInfluencerProfileDto } from './dto/save-influencer-profile.dto';
import { SearchInfluencersDto } from './dto/search-influencers.dto';
import { RankingService } from '../ranking/ranking.service';
import { isEntityNotFoundError } from '../../database/errors/entity-not-found.type-guard';
import { cif } from '../../database/errors/tryQuery';

@Injectable()
export class InfluencerService {
    private readonly logger = new Logger(InfluencerService.name);

    constructor(
        @InjectRepository(InfluencerProfile)
        private readonly influencerRepo: Repository<InfluencerProfile>,
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        @InjectRepository(Collaboration)
        private readonly collaborationRepo: Repository<Collaboration>,
        private readonly rankingService: RankingService,
    ) { }

    /**
     * Count completed collaborations for an influencer profile
     */
    private async getCompletedCollaborationsCount(influencerProfileId: string): Promise<number> {
        return this.collaborationRepo.count({
            where: {
                influencer: { id: influencerProfileId },
                status: CollaborationStatus.COMPLETED,
            },
        });
    }

    async getInfluencerProfile(userId: string): Promise<InfluencerProfile & { completedCollaborations: number }> {
        try {
            const profile = await this.influencerRepo.findOne({
                where: { user: { id: userId } },
                relations: ['user'],
            });

            if (!profile) {
                throw new NotFoundException('Influencer profile not found');
            }

            const completedCollaborations = await this.getCompletedCollaborationsCount(profile.id);

            // Always sync ranking to ensure tier is up-to-date
            try {
                const updatedProfile = await this.rankingService.updateRanking(userId);
                return { ...updatedProfile, completedCollaborations };
            } catch (error) {
                this.logger.warn(`Failed to sync ranking for user ${userId}: ${error.message}`);
                return { ...profile, completedCollaborations };
            }
        } catch (error) {
            cif(isEntityNotFoundError, new NotFoundException('Influencer profile not found'))(error);
            throw error;
        }
    }

    async saveInfluencerProfile(userId: string, saveDto: SaveInfluencerProfileDto): Promise<InfluencerProfile> {
        const user = await this.userRepo.findOneBy({ id: userId });
        if (!user || user.role !== UserRole.INFLUENCER) {
            throw new ForbiddenException('Only users with INFLUENCER role can have an influencer profile');
        }

        let profile = await this.influencerRepo.findOne({
            where: { user: { id: userId } },
        });

        if (!profile) {
            profile = this.influencerRepo.create({
                user: { id: userId } as any,
                ...saveDto,
            });
        } else {
            Object.assign(profile, saveDto);
        }

        await this.influencerRepo.save(profile);

        // Update ranking after profile changes
        try {
            await this.rankingService.updateRanking(userId);
        } catch (error) {
            this.logger.error(`Failed to update ranking after profile save for user ${userId}: ${error.message}`);
        }

        return this.getInfluencerProfile(userId);
    }

    async searchInfluencers(searchDto: SearchInfluencersDto) {
        const { niche, platform, minFollowers, page, limit, search, rankingTier, minRating, maxRating, verified } = searchDto;
        const query = this.influencerRepo.createQueryBuilder('influencer')
            .innerJoinAndSelect('influencer.user', 'user')
            .leftJoinAndSelect('user.profile', 'profile')
            .where('user.role = :role', { role: UserRole.INFLUENCER })
            .andWhere('user.status = :status', { status: UserStatus.ACTIVE });

        if (search) {
            query.andWhere(
                '(profile.fullName ILIKE :search OR profile.username ILIKE :search OR profile.bio ILIKE :search OR influencer.fullName ILIKE :search)',
                { search: `%${search}%` }
            );
        }

        if (niche) {
            query.andWhere('influencer.niche ILIKE :niche', { niche: `%${niche}%` });
        }

        if (platform) {
            query.andWhere('influencer.platforms::text ILIKE :platform', { platform: `%${platform}%` });
        }

        if (rankingTier) {
            query.andWhere('influencer.rankingTier = :rankingTier', { rankingTier });
        }

        if (minRating !== undefined && minRating !== null) {
            query.andWhere('CAST(influencer.avgRating AS DECIMAL) >= :minRating', { minRating });
        }

        if (maxRating !== undefined && maxRating !== null) {
            query.andWhere('CAST(influencer.avgRating AS DECIMAL) <= :maxRating', { maxRating });
        }

        if (verified !== undefined && verified !== null) {
            query.andWhere('influencer.verified = :verified', { verified });
        }

        // Note: minFollowers filter removed as followersCount is now calculated from platforms JSONB
        // Future enhancement: Add JSONB query to filter by total followers across platforms

        const [items, total] = await query
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

        // Sync rankings for all returned profiles to ensure tiers are current
        const syncedItems = await Promise.all(
            items.map(async (item) => {
                try {
                    const updatedProfile = await this.rankingService.updateRanking(item.user.id);
                    const completedCollaborations = await this.getCompletedCollaborationsCount(item.id);
                    return { ...updatedProfile, completedCollaborations };
                } catch (error) {
                    this.logger.warn(`Failed to sync ranking for user ${item.user.id}: ${error.message}`);
                    const completedCollaborations = await this.getCompletedCollaborationsCount(item.id).catch(() => 0);
                    return { ...item, completedCollaborations };
                }
            })
        );

        return {
            items: syncedItems,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getInfluencerById(id: string): Promise<InfluencerProfile & { completedCollaborations: number }> {
        try {
            const profile = await this.influencerRepo.findOne({
                where: { id },
                relations: ['user', 'user.profile'],
            });

            if (!profile) {
                throw new NotFoundException('Influencer not found');
            }

            const completedCollaborations = await this.getCompletedCollaborationsCount(profile.id);

            // Sync ranking to ensure tier is up-to-date
            try {
                const updatedProfile = await this.rankingService.updateRanking(profile.user.id);
                return { ...updatedProfile, completedCollaborations };
            } catch (error) {
                this.logger.warn(`Failed to sync ranking for influencer ${id}: ${error.message}`);
                return { ...profile, completedCollaborations };
            }
        } catch (error) {
            cif(isEntityNotFoundError, new NotFoundException('Influencer not found'))(error);
            throw error;
        }
    }
}
