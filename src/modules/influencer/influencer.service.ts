import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InfluencerProfile } from '../../database/entities/influencer-profile.entity';
import { User } from '../../database/entities/user.entity';
import { UserRole, UserStatus } from '../../database/entities/enums';
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
        private readonly rankingService: RankingService,
    ) { }

    async getInfluencerProfile(userId: string): Promise<InfluencerProfile> {
        try {
            const profile = await this.influencerRepo.findOne({
                where: { user: { id: userId } },
                relations: ['user'],
            });

            if (!profile) {
                throw new NotFoundException('Influencer profile not found');
            }

            // Sync ranking if score is null, old system (> 100), or tier is missing
            const currentScore = Number(profile.rankingScore);
            if (profile.rankingScore === null || currentScore > 100 || !profile.rankingTier) {
                this.logger.log(`Syncing ranking for user ${userId} (Score: ${currentScore}, Tier: ${profile.rankingTier})`);
                return await this.rankingService.updateRanking(userId);
            }

            return profile;
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
        const { niche, platform, minFollowers, page, limit, search } = searchDto;
        const query = this.influencerRepo.createQueryBuilder('influencer')
            .innerJoinAndSelect('influencer.user', 'user')
            .leftJoinAndSelect('user.profile', 'profile')
            .where('user.role = :role', { role: UserRole.INFLUENCER })
            .andWhere('user.status = :status', { status: UserStatus.ACTIVE });

        if (search) {
            query.andWhere(
                '(profile.fullName ILIKE :search OR profile.username ILIKE :search OR profile.bio ILIKE :search)',
                { search: `%${search}%` }
            );
        }

        if (niche) {
            query.andWhere('influencer.niche ILIKE :niche', { niche: `%${niche}%` });
        }

        if (platform) {
            query.andWhere('influencer.platforms::text ILIKE :platform', { platform: `%${platform}%` });
        }

        if (minFollowers) {
            query.andWhere('influencer.followersCount >= :minFollowers', { minFollowers });
        }

        const [items, total] = await query
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

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

    async getInfluencerById(id: string): Promise<InfluencerProfile> {
        try {
            const profile = await this.influencerRepo.findOne({
                where: { id },
                relations: ['user', 'user.profile'],
            });

            if (!profile) {
                throw new NotFoundException('Influencer not found');
            }

            return profile;
        } catch (error) {
            cif(isEntityNotFoundError, new NotFoundException('Influencer not found'))(error);
            throw error;
        }
    }
}
