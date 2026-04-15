import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InfluencerService } from '../influencer/influencer.service';
import { ProfileService } from '../profile/profile.service';
import { ReviewService } from '../review/review.service';
import { RankingService } from '../ranking/ranking.service';
import { Collaboration } from '../../database/entities/collaboration.entity';
import { Auction } from '../../database/entities/auction.entity';
import { CollaborationStatus, AuctionStatus } from '../../database/entities/enums';
import { PublicInfluencerProfileDto } from './dto/public-influencer-profile.dto';
import { PublicBrandProfileDto } from './dto/public-brand-profile.dto';

@Injectable()
export class PublicService {
    constructor(
        private readonly influencerService: InfluencerService,
        private readonly profileService: ProfileService,
        private readonly reviewService: ReviewService,
        private readonly rankingService: RankingService,
        @InjectRepository(Collaboration)
        private readonly collaborationRepo: Repository<Collaboration>,
        @InjectRepository(Auction)
        private readonly auctionRepo: Repository<Auction>,
    ) { }

    async getInfluencerPublicData(id: string): Promise<PublicInfluencerProfileDto> {
        const influencer = await this.influencerService.getInfluencerById(id);
        if (!influencer) {
            throw new NotFoundException('Influencer not found');
        }

        // Fetch additional data in parallel to reduce latency
        const [reviews, ranking, activeCollaborations, completedCollaborations, completedCollabCount] = await Promise.all([
            this.reviewService.getInfluencerReviews(id),
            this.rankingService.getRankingBreakdown(id).catch(() => null),
            this.collaborationRepo.find({
                where: [
                    { influencer: { id }, status: CollaborationStatus.ACCEPTED },
                    { influencer: { id }, status: CollaborationStatus.IN_PROGRESS }
                ],
                relations: ['requester', 'requester.profile'],
                order: { updatedAt: 'DESC' },
                take: 5
            }),
            this.collaborationRepo.find({
                where: { influencer: { id }, status: CollaborationStatus.COMPLETED },
                relations: ['requester', 'requester.profile'],
                order: { updatedAt: 'DESC' },
                take: 10
            }),
            this.collaborationRepo.count({
                where: { influencer: { id }, status: CollaborationStatus.COMPLETED }
            })
        ]);

        // Calculate total reach across all platforms if totalFollowers is not set
        const calculatedTotalReach = influencer.totalFollowers || 
            Object.values(influencer.platforms || {}).reduce((sum: number, p: any) => sum + (p.followers || 0), 0);

        return {
            id: influencer.id,
            fullName: influencer.fullName,
            avatarUrl: influencer.avatarUrl || influencer.user?.profile?.avatarUrl,
            bio: influencer.bio,
            platforms: influencer.platforms,
            categories: influencer.categories,
            locationCountry: influencer.locationCountry,
            locationCity: influencer.locationCity,
            totalFollowers: Number(calculatedTotalReach),
            avgEngagementRate: influencer.avgEngagementRate,
            rankingTier: influencer.rankingTier,
            verified: influencer.verified,
            username: influencer.user?.profile?.username || 'user',
            reviews,
            ranking,
            activeCollaborations,
            completedCollaborations: completedCollaborations as any,
            avgRating: influencer.avgRating || 0,
            totalReviews: influencer.totalReviews || 0,
            completedCollabCount: completedCollabCount,
            address: influencer.address,
            gender: influencer.gender,
            languages: influencer.languages,
            audienceGenderRatio: influencer.audienceGenderRatio,
            audienceAgeBrackets: influencer.audienceAgeBrackets,
            audienceTopCountries: influencer.audienceTopCountries,
            minPrice: influencer.minPrice,
            maxPrice: influencer.maxPrice
        };
    }

    async getBrandPublicData(id: string): Promise<PublicBrandProfileDto> {
        const brandProfile = await this.profileService.getBrandProfile(id);
        if (!brandProfile) {
            throw new NotFoundException('Brand profile not found');
        }

        const userId = brandProfile.user?.id;

        const auctionsDone = await this.auctionRepo.find({
            where: { creator: { id: userId }, status: AuctionStatus.COMPLETED },
            order: { createdAt: 'DESC' },
            take: 10
        });

        const collaborationsDone = await this.collaborationRepo.find({
            where: { requester: { id: userId }, status: CollaborationStatus.COMPLETED },
            relations: ['influencer'],
            order: { updatedAt: 'DESC' },
            take: 10
        });

        return {
            id: brandProfile.id,
            fullName: brandProfile.fullName,
            username: brandProfile.username,
            avatarUrl: brandProfile.avatarUrl,
            bio: brandProfile.bio,
            location: brandProfile.location,
            socialLinks: brandProfile.socialLinks,
            auctionsDone,
            collaborationsDone
        };
    }
}
