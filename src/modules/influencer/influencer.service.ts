import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InfluencerProfile } from '../../database/entities/influencer-profile.entity';
import { SaveInfluencerProfileDto } from './dto/save-influencer-profile.dto';
import { SearchInfluencersDto } from './dto/search-influencers.dto';
import { isEntityNotFoundError } from '../../database/errors/entity-not-found.type-guard';
import { cif } from '../../database/errors/tryQuery';

@Injectable()
export class InfluencerService {
    constructor(
        @InjectRepository(InfluencerProfile)
        private readonly influencerRepo: Repository<InfluencerProfile>,
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

            return profile;
        } catch (error) {
            cif(isEntityNotFoundError, new NotFoundException('Influencer profile not found'))(error);
        }
    }

    async saveInfluencerProfile(userId: string, saveDto: SaveInfluencerProfileDto): Promise<InfluencerProfile> {
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

        return await this.influencerRepo.save(profile);
    }

    async searchInfluencers(searchDto: SearchInfluencersDto) {
        const { niche, platform, minFollowers, page, limit } = searchDto;
        const query = this.influencerRepo.createQueryBuilder('influencer')
            .leftJoinAndSelect('influencer.user', 'user')
            .leftJoinAndSelect('user.profile', 'profile');

        if (niche) {
            query.andWhere('influencer.niche ILIKE :niche', { niche: `%${niche}%` });
        }

        if (platform) {
            // Searching inside platforms JSONB
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
        }
    }
}
