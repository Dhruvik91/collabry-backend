import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InfluencerProfile } from '../../database/entities/influencer-profile.entity';
import { Collaboration } from '../../database/entities/collaboration.entity';
import { Review } from '../../database/entities/review.entity';
import { CollaborationStatus, UserRole } from '../../database/entities/enums';
import { RankingBreakdownDto } from './dto/ranking-breakdown.dto';
import { RankingWeightsDto } from './dto/ranking-weights.dto';

interface RankingWeights {
    completedCollaborations: number;
    paidPromotions: number;
    averageRating: number;
    responseSpeed: number;
    completionRate: number;
    verificationBonus: number;
    cancellationPenalty: number;
    rejectionPenalty: number;
    lowRatingPenalty: number;
}

@Injectable()
export class RankingService {
    private readonly logger = new Logger(RankingService.name);
    private weights: RankingWeights;

    constructor(
        @InjectRepository(InfluencerProfile)
        private readonly influencerRepo: Repository<InfluencerProfile>,
        @InjectRepository(Collaboration)
        private readonly collaborationRepo: Repository<Collaboration>,
        @InjectRepository(Review)
        private readonly reviewRepo: Repository<Review>,
    ) {
        this.loadWeights();
    }

    /**
     * Load ranking weights from configuration
     * In production, this should load from database for dynamic configuration
     */
    private loadWeights(): void {
        this.weights = {
            completedCollaborations: 10,
            paidPromotions: 15,
            averageRating: 50,
            responseSpeed: 20,
            completionRate: 30,
            verificationBonus: 100,
            cancellationPenalty: -25,
            rejectionPenalty: -15,
            lowRatingPenalty: -50,
        };
    }

    /**
     * Calculate ranking breakdown for an influencer
     * @param influencerId - User ID of the influencer
     * @returns Detailed ranking breakdown
     */
    async calculateRanking(influencerId: string): Promise<RankingBreakdownDto> {
        try {
            // Fetch influencer profile
            const influencer = await this.influencerRepo.findOne({
                where: { user: { id: influencerId } },
                relations: ['user'],
            });

            if (!influencer) {
                return {
                    completedCollaborations: { count: 0, score: 0, maxScore: 0 },
                    paidPromotions: { count: 0, score: 0, maxScore: 0 },
                    averageRating: { value: 0, score: 0, maxScore: 0 },
                    responseSpeed: { hours: 0, score: 0, maxScore: 0 },
                    completionRate: { percentage: 0, score: 0, maxScore: 0 },
                    verificationBonus: { isVerified: false, score: 0, maxScore: 50 },
                    penalties: { count: 0, score: 0, breakdown: { cancellations: 0, rejections: 0, reports: 0 } },
                    totalScore: 0,
                    rankingTier: 'Rising Creator',
                    nextTier: 'Emerging Partner',
                    tierProgress: 0,
                    requirementsMet: {},
                    tierRequirements: {},
                };
            }

            // Calculate completed collaborations (1 point each)
            const completedCollabs = await this.collaborationRepo.count({
                where: {
                    influencer: { user: { id: influencerId } },
                    status: CollaborationStatus.COMPLETED,
                },
            });

            // Verification status (50 point bonus)
            const isVerified = influencer.verified || false;

            // --- Simplified Score Calculation ---
            // 1 point per completed collaboration + 50 points for verification
            const collaborationScore = completedCollabs;
            const verificationScore = isVerified ? 50 : 0;
            const totalScore = collaborationScore + verificationScore;

            // --- Simplified Tier Determination (Collaboration Count + Verification Only) ---
            let tier = 'Rising Creator';
            const tierRequirements = {
                'Kollabary Icon': {
                    minCollabs: 100,
                    verified: true,
                },
                'Elite Creator': {
                    minCollabs: 60,
                    verified: true,
                },
                'Pro Influencer': {
                    minCollabs: 30,
                    verified: true,
                },
                'Trusted Collaborator': {
                    minCollabs: 15,
                    verified: false,
                },
                'Emerging Partner': {
                    minCollabs: 5,
                    verified: false,
                },
                'Rising Creator': {
                    minCollabs: 0,
                    verified: false,
                },
            };

            // Determine tier based on collaboration count + verification
            if (completedCollabs >= 100 && isVerified) {
                tier = 'Kollabary Icon';
            } else if (completedCollabs >= 60 && isVerified) {
                tier = 'Elite Creator';
            } else if (completedCollabs >= 30 && isVerified) {
                tier = 'Pro Influencer';
            } else if (completedCollabs >= 15) {
                tier = 'Trusted Collaborator';
            } else if (completedCollabs >= 5) {
                tier = 'Emerging Partner';
            }

            // Get current tier requirements for display
            const currentTierReqs = tierRequirements[tier];

            return {
                completedCollaborations: { count: completedCollabs, score: collaborationScore, maxScore: 0 },
                paidPromotions: { count: 0, score: 0, maxScore: 0 },
                averageRating: { value: 0, score: 0, maxScore: 0 },
                responseSpeed: { hours: 0, score: 0, maxScore: 0 },
                completionRate: { percentage: 0, score: 0, maxScore: 0 },
                verificationBonus: { isVerified, score: verificationScore, maxScore: 50 },
                penalties: { 
                    count: 0, 
                    score: 0,
                    breakdown: {
                        cancellations: 0,
                        rejections: 0,
                        reports: 0,
                    }
                },
                totalScore,
                rankingTier: tier,
                nextTier: this.getNextTier(tier),
                tierProgress: this.calculateTierProgress(
                    tier, 
                    totalScore, 
                    tierRequirements,
                    completedCollabs,
                    0,
                    0,
                    0,
                    isVerified,
                    0
                ),
                requirementsMet: {
                    completedCollabs: completedCollabs >= currentTierReqs.minCollabs,
                    verified: currentTierReqs.verified ? isVerified : true,
                },
                tierRequirements: currentTierReqs,
            };
        } catch (error) {
            this.logger.error(`Error calculating ranking for influencer ${influencerId}:`, error);
            throw error;
        }
    }

    /**
     * Get the next tier for progression display
     */
    private getNextTier(currentTier: string): string | null {
        const tierOrder = ['Rising Creator', 'Emerging Partner', 'Trusted Collaborator', 'Pro Influencer', 'Elite Creator', 'Kollabary Icon'];
        const currentIndex = tierOrder.indexOf(currentTier);
        if (currentIndex === -1 || currentIndex === tierOrder.length - 1) {
            return null;
        }
        return tierOrder[currentIndex + 1];
    }

    /**
     * Calculate progress towards next tier (simplified - collaboration count + verification only)
     */
    private calculateTierProgress(
        currentTier: string, 
        currentScore: number, 
        tierRequirements: any,
        completedCollabs?: number,
        averageRating?: number,
        completionRate?: number,
        avgResponseHours?: number,
        isVerified?: boolean,
        totalPenalties?: number
    ): number {
        const tierOrder = ['Rising Creator', 'Emerging Partner', 'Trusted Collaborator', 'Pro Influencer', 'Elite Creator', 'Kollabary Icon'];
        const currentIndex = tierOrder.indexOf(currentTier);
        
        if (currentIndex === -1 || currentIndex === tierOrder.length - 1) {
            return 100;
        }

        const nextTier = tierOrder[currentIndex + 1];
        const nextTierReqs = tierRequirements[nextTier];
        const currentTierReqs = tierRequirements[currentTier];

        if (!nextTierReqs || !currentTierReqs) {
            return 0;
        }

        const progressMetrics: number[] = [];

        // Collaborations progress
        if (completedCollabs !== undefined) {
            const collabRange = nextTierReqs.minCollabs - currentTierReqs.minCollabs;
            if (collabRange > 0) {
                const collabProgress = ((completedCollabs - currentTierReqs.minCollabs) / collabRange) * 100;
                progressMetrics.push(Math.min(100, Math.max(0, collabProgress)));
            }
        }

        // Verification (binary - 0% or 100%)
        if (nextTierReqs.verified && !currentTierReqs.verified) {
            progressMetrics.push(isVerified ? 100 : 0);
        }

        // Return average progress across requirements
        if (progressMetrics.length === 0) {
            return 100; // If no requirements to meet, already at 100%
        }

        const averageProgress = progressMetrics.reduce((sum, val) => sum + val, 0) / progressMetrics.length;
        return Math.round(averageProgress);
    }

    /**
     * Get tier requirements guide for all tiers
     */
    async getTierRequirementsGuide(): Promise<any> {
        return {
            tiers: [
                {
                    name: 'Rising Creator',
                    description: 'Just getting started on your collaboration journey',
                    requirements: {
                        completedCollabs: 0,
                        verified: false,
                    },
                    benefits: ['Access to basic collaborations', 'Profile visibility', 'Community support'],
                },
                {
                    name: 'Emerging Partner',
                    description: 'Building your reputation with consistent collaborations',
                    requirements: {
                        completedCollabs: 5,
                        verified: false,
                    },
                    benefits: ['Priority in search results', 'Access to more campaigns', 'Basic analytics'],
                },
                {
                    name: 'Trusted Collaborator',
                    description: 'Proven track record of reliable collaborations',
                    requirements: {
                        completedCollabs: 15,
                        verified: false,
                    },
                    benefits: ['Featured in recommendations', 'Advanced analytics', 'Priority support'],
                },
                {
                    name: 'Pro Influencer',
                    description: 'Professional creator with verified excellence',
                    requirements: {
                        completedCollabs: 30,
                        verified: true,
                    },
                    benefits: ['Premium campaign access', 'Higher visibility', 'Exclusive opportunities', 'Pro badge'],
                },
                {
                    name: 'Elite Creator',
                    description: 'Top-tier creator with exceptional performance',
                    requirements: {
                        completedCollabs: 60,
                        verified: true,
                    },
                    benefits: ['VIP campaign invitations', 'Maximum visibility', 'Dedicated account manager', 'Elite badge'],
                },
                {
                    name: 'Kollabary Icon',
                    description: 'The pinnacle of creator excellence',
                    requirements: {
                        completedCollabs: 100,
                        verified: true,
                    },
                    benefits: ['Exclusive brand partnerships', 'Featured on platform', 'Premium support', 'Icon badge', 'Revenue share bonuses'],
                },
            ],
            scoringGuide: {
                completedCollaborations: {
                    description: 'Total number of successfully completed collaborations',
                    calculation: '1 point per completed collaboration',
                    tips: ['Complete all accepted collaborations', 'Deliver quality work on time', 'Maintain good communication'],
                },
                verificationBonus: {
                    description: 'One-time bonus for account verification',
                    calculation: '50 points when verified',
                    tips: ['Verify your account to unlock higher tiers', 'Verification shows credibility to brands', 'Required for Pro, Elite, and Icon tiers'],
                },
            },
        };
    }

    /**
     * Get ranking breakdown for an influencer
     */
    async getRankingBreakdown(influencerId: string): Promise<RankingBreakdownDto> {
        return this.calculateRanking(influencerId);
    }

    /**
     * Update ranking score for an influencer and save to database
     */
    async updateRanking(influencerId: string): Promise<InfluencerProfile> {
        try {
            const breakdown = await this.calculateRanking(influencerId);

            const profile = await this.influencerRepo.findOne({
                where: { user: { id: influencerId } },
                relations: ['user'],
            });

            if (!profile) {
                throw new NotFoundException('Influencer profile not found');
            }

            // Update ranking score and tier
            profile.rankingScore = breakdown.totalScore;
            profile.rankingTier = breakdown.rankingTier;

            await this.influencerRepo.save(profile);

            this.logger.log(`Updated ranking for influencer ${influencerId}: ${breakdown.rankingTier} (${breakdown.totalScore})`);

            return profile;
        } catch (error) {
            this.logger.error(`Error updating ranking for influencer ${influencerId}:`, error);
            throw error;
        }
    }

    /**
     * Recalculate ranking for a specific influencer
     */
    async recalculateRanking(influencerId: string): Promise<RankingBreakdownDto> {
        return this.calculateRanking(influencerId);
    }

    /**
     * Recalculate rankings for all influencers (admin only)
     */
    async recalculateAllRankings(): Promise<{ processed: number; errors: number }> {
        const influencers = await this.influencerRepo.find({
            relations: ['user'],
        });

        let processed = 0;
        let errors = 0;

        for (const influencer of influencers) {
            try {
                await this.updateRanking(influencer.user.id);
                processed++;
            } catch (error) {
                this.logger.error(`Error recalculating ranking for influencer ${influencer.user.id}:`, error);
                errors++;
            }
        }

        return { processed, errors };
    }

    /**
     * Get current ranking weights
     */
    getWeights(): RankingWeightsDto {
        return this.weights;
    }

    /**
     * Update ranking weights (admin only)
     */
    updateWeights(newWeights: Partial<RankingWeightsDto>): RankingWeightsDto {
        this.weights = { ...this.weights, ...newWeights };
        return this.weights;
    }
}
