import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InfluencerService } from '../influencer/influencer.service';
import { ProfileService } from '../profile/profile.service';
import { ReviewService } from '../review/review.service';
import { RankingService } from '../ranking/ranking.service';
import { Collaboration } from '../../database/entities/collaboration.entity';
import { CollaborationStatus } from '../../database/entities/enums';
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
    ) { }

    private mapInfluencerSummary(collab: Collaboration) {
        return {
            id: collab.influencer?.id,
            fullName: collab.influencer?.fullName || collab.influencer?.user?.profile?.fullName || collab.influencer?.user?.profile?.username || 'Creator',
            avatarUrl: collab.influencer?.avatarUrl || collab.influencer?.user?.profile?.avatarUrl,
            username: collab.influencer?.user?.profile?.username,
        };
    }

    private mapBrandSummary(collab: Collaboration) {
        const profile = collab.requester?.profile;
        return {
            id: profile?.id,
            fullName: profile?.fullName || profile?.username || 'Brand',
            avatarUrl: profile?.avatarUrl,
            username: profile?.username,
        };
    }

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
                take: 10
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

        const activePartners = activeCollaborations
            .map((collab) => this.mapBrandSummary(collab))
            .filter((partner) => partner?.id);

        const completedPartners = completedCollaborations
            .map((collab) => this.mapBrandSummary(collab))
            .filter((partner) => partner?.id);

        const partnerMap = new Map<string, any>();
        activePartners.forEach((partner) => {
            if (partner?.id) {
                partnerMap.set(partner.id, partner);
            }
        });

        completedPartners.forEach((partner) => {
            if (partner?.id) {
                if (!partnerMap.has(partner.id)) {
                    partnerMap.set(partner.id, partner);
                }
            }
        });

        const brandPartners = Array.from(partnerMap.values());
        const completedPartnerCount = new Set<string>();
        completedPartners.forEach((partner) => {
            if (partner?.id) {
                completedPartnerCount.add(partner.id);
            }
        });

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
            brandPartners,
            brandPartnerCount: completedPartnerCount.size,
            avgRating: influencer.avgRating || 0,
            totalReviews: influencer.totalReviews || 0,
            completedCollabCount: completedCollabCount,
            // SECURITY: Only share non-personal data. Omitted address and gender as per request.
            languages: influencer.languages,
            audienceGenderRatio: influencer.audienceGenderRatio,
            audienceAgeBrackets: influencer.audienceAgeBrackets,
            audienceTopCountries: influencer.audienceTopCountries,
            minPrice: influencer.minPrice,
            maxPrice: influencer.maxPrice
        } as any;
    }

    async getBrandPublicData(id: string): Promise<PublicBrandProfileDto> {
        const brandProfile = await this.profileService.getBrandProfile(id);
        if (!brandProfile) {
            throw new NotFoundException('Brand profile not found');
        }

        const userId = brandProfile.user?.id;

        const collaborations = await this.collaborationRepo.find({
            where: { requester: { id: userId }, status: CollaborationStatus.COMPLETED },
            relations: ['influencer', 'influencer.user', 'influencer.user.profile'],
            order: { updatedAt: 'DESC' },
            take: 12
        });

        const collaboratorMap = new Map<string, any>();
        collaborations.forEach((collab) => {
            const summary = this.mapInfluencerSummary(collab);
            if (summary?.id && !collaboratorMap.has(summary.id)) {
                collaboratorMap.set(summary.id, summary);
            }
        });

        const collaborators = Array.from(collaboratorMap.values());
        const stats = (brandProfile as any).stats || {};

        return {
            id: brandProfile.id,
            fullName: brandProfile.fullName,
            username: brandProfile.username,
            avatarUrl: brandProfile.avatarUrl,
            bio: brandProfile.bio,
            location: brandProfile.location,
            socialLinks: brandProfile.socialLinks,
            stats: {
                totalAuctions: stats.totalAuctions ?? 0,
                activeAuctionsCount: stats.activeAuctionsCount ?? 0,
                completedCollaborations: stats.completedCollaborations ?? collaborators.length,
            },
            collaboratorCount: collaborators.length,
            collaborators,
        };
    }
}

