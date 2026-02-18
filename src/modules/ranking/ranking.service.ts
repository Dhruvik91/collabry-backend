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
                    completedCollaborations: { count: 0, score: 0, maxScore: 25 },
                    paidPromotions: { count: 0, score: 0, maxScore: 15 },
                    averageRating: { value: 0, score: 0, maxScore: 25 },
                    responseSpeed: { hours: 48, score: 0, maxScore: 10 },
                    completionRate: { percentage: 0, score: 0, maxScore: 20 },
                    verificationBonus: { isVerified: false, score: 0, maxScore: 5 },
                    penalties: { count: 0, score: 0, breakdown: { cancellations: 0, rejections: 0, reports: 0 } },
                    totalScore: 0,
                    rankingTier: 'Rising Creator',
                    nextTier: 'Emerging Partner',
                    tierProgress: 0,
                    requirementsMet: {},
                    tierRequirements: {},
                };
            }

            // 1. Calculate completed collaborations
            const completedCollabs = await this.collaborationRepo.count({
                where: {
                    influencer: { user: { id: influencerId } },
                    status: CollaborationStatus.COMPLETED,
                },
            });

            // 2. Calculate paid promotions
            // Assuming for now that any collaboration with a prize/payment in agreedTerms is paid
            // This is a placeholder logic if we don't have a specific field yet
            const paidPromotions = await this.collaborationRepo
                .createQueryBuilder('collab')
                .where('collab.influencerId = :profileId', { profileId: influencer.id })
                .andWhere('collab.status = :status', { status: CollaborationStatus.COMPLETED })
                // .andWhere('collab.agreedTerms ->> "price" IS NOT NULL') // Example if we use jsonb
                .getCount();

            // 3. Calculate average rating
            const reviews = await this.reviewRepo.find({
                where: { influencer: { id: influencer.id } },
                select: ['rating'],
            });

            const averageRating = reviews.length > 0
                ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
                : 0;

            // 4. Calculate response speed (average hours to respond to request)
            const recentCollabs = await this.collaborationRepo
                .createQueryBuilder('collab')
                .where('collab.influencerId = :profileId', { profileId: influencer.id })
                .andWhere('collab.status NOT IN (:...statuses)', {
                    statuses: [CollaborationStatus.REQUESTED],
                })
                .orderBy('collab.createdAt', 'DESC')
                .limit(50)
                .getMany();

            let totalResponseTime = 0;
            let responseCount = 0;

            for (const collab of recentCollabs) {
                if (collab.updatedAt && collab.createdAt) {
                    const responseTime =
                        (collab.updatedAt.getTime() - collab.createdAt.getTime()) /
                        (1000 * 60 * 60); // Convert to hours
                    totalResponseTime += responseTime;
                    responseCount++;
                }
            }

            const avgResponseHours = responseCount > 0 ? totalResponseTime / responseCount : 48; // Default to 48h if no responses

            // 5. Calculate completion rate
            const acceptedOrCancelled = await this.collaborationRepo.count({
                where: {
                    influencer: { id: influencer.id },
                    status: In([
                        CollaborationStatus.ACCEPTED,
                        CollaborationStatus.IN_PROGRESS,
                        CollaborationStatus.COMPLETED,
                        CollaborationStatus.CANCELLED,
                    ]),
                },
            });

            const completionRate = acceptedOrCancelled > 0 ? (completedCollabs / acceptedOrCancelled) * 100 : 0;

            // 6. Verification status
            const isVerified = influencer.verified || false;

            // 7. Fraud Flags (Active reports)
            const reportsCount = await this.influencerRepo.manager
                .getRepository('reports')
                .count({
                    where: {
                        targetUser: { id: influencerId },
                        status: In(['OPEN', 'UNDER_REVIEW']),
                    },
                });

            // Calculate cancellations and rejections for penalties
            const cancelledCollabs = await this.collaborationRepo.count({
                where: {
                    influencer: { id: influencer.id },
                    status: CollaborationStatus.CANCELLED,
                },
            });

            const rejectedCollabs = await this.collaborationRepo.count({
                where: {
                    influencer: { id: influencer.id },
                    status: CollaborationStatus.REJECTED,
                },
            });

            // Calculate consistency score (recent 30 days activity)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const recentCompletedCollabs = await this.collaborationRepo.count({
                where: {
                    influencer: { id: influencer.id },
                    status: CollaborationStatus.COMPLETED,
                    updatedAt: In([thirtyDaysAgo]),
                },
            });

            // --- Enhanced Normalized Score Calculation (0-100) ---
            // Balanced scoring with diminishing returns:
            // Completed Collabs: Uses square root curve - rewards early progress, 50+ for max
            // Paid Promotions: Uses square root curve - rewards early progress, 25+ for max
            // Avg Rating: 5.0 -> 25 pts (quality matters most)
            // Completion Rate: 100% -> 20 pts (reliability is key)
            // Response Speed: <6h -> 10 pts (fast response valued)
            // Verification: true -> 5 pts (expected behavior)

            const scores = {
                // Square root curve: 1->5pts, 5->11pts, 10->16pts, 25->25pts, 50+->25pts
                completed: Math.min(25, Math.sqrt(completedCollabs / 50) * 25),
                // Square root curve: 1->6pts, 5->13pts, 10->15pts, 25+->15pts
                paid: Math.min(15, Math.sqrt(paidPromotions / 25) * 15),
                rating: (averageRating / 5.0) * 25,
                completion: (completionRate / 100) * 20,
                response: avgResponseHours < 6 ? 10 : avgResponseHours > 48 ? 0 : ((48 - avgResponseHours) / 42) * 10,
                verification: isVerified ? 5 : 0,
            };

            // Apply penalties
            const penaltyScore = (cancelledCollabs * this.weights.cancellationPenalty) + 
                                (rejectedCollabs * this.weights.rejectionPenalty) + 
                                (averageRating < 3.0 && reviews.length > 0 ? this.weights.lowRatingPenalty : 0);

            let totalScore = Object.values(scores).reduce((a, b) => a + b, 0) + penaltyScore;
            totalScore = Math.max(0, Math.min(100, Math.round(totalScore)));

            // --- Stricter Tier Determination with Multiple Requirements ---
            let tier = 'Rising Creator';
            const tierRequirements = {
                'Kollabary Icon': {
                    minScore: 92,
                    minCollabs: 100,
                    minRating: 4.8,
                    minCompletion: 98,
                    maxResponseHours: 6,
                    verified: true,
                    maxPenalties: 0,
                },
                'Elite Creator': {
                    minScore: 80,
                    minCollabs: 50,
                    minRating: 4.6,
                    minCompletion: 95,
                    maxResponseHours: 12,
                    verified: true,
                    maxPenalties: 2,
                },
                'Pro Influencer': {
                    minScore: 65,
                    minCollabs: 25,
                    minRating: 4.3,
                    minCompletion: 90,
                    maxResponseHours: 24,
                    verified: true,
                    maxPenalties: 5,
                },
                'Trusted Collaborator': {
                    minScore: 45,
                    minCollabs: 10,
                    minRating: 4.0,
                    minCompletion: 85,
                    maxResponseHours: 36,
                    verified: false,
                    maxPenalties: 8,
                },
                'Emerging Partner': {
                    minScore: 25,
                    minCollabs: 3,
                    minRating: 3.5,
                    minCompletion: 75,
                    maxResponseHours: 48,
                    verified: false,
                    maxPenalties: 12,
                },
                'Rising Creator': {
                    minScore: 0,
                    minCollabs: 0,
                    minRating: 0,
                    minCompletion: 0,
                    maxResponseHours: 999,
                    verified: false,
                    maxPenalties: 999,
                },
            };

            // Determine tier based on meeting ALL requirements
            const totalPenalties = cancelledCollabs + rejectedCollabs + reportsCount;
            if (totalScore >= tierRequirements['Kollabary Icon'].minScore &&
                completedCollabs >= tierRequirements['Kollabary Icon'].minCollabs &&
                averageRating >= tierRequirements['Kollabary Icon'].minRating &&
                completionRate >= tierRequirements['Kollabary Icon'].minCompletion &&
                avgResponseHours <= tierRequirements['Kollabary Icon'].maxResponseHours &&
                isVerified &&
                totalPenalties <= tierRequirements['Kollabary Icon'].maxPenalties) {
                tier = 'Kollabary Icon';
            } else if (totalScore >= tierRequirements['Elite Creator'].minScore &&
                completedCollabs >= tierRequirements['Elite Creator'].minCollabs &&
                averageRating >= tierRequirements['Elite Creator'].minRating &&
                completionRate >= tierRequirements['Elite Creator'].minCompletion &&
                avgResponseHours <= tierRequirements['Elite Creator'].maxResponseHours &&
                isVerified &&
                totalPenalties <= tierRequirements['Elite Creator'].maxPenalties) {
                tier = 'Elite Creator';
            } else if (totalScore >= tierRequirements['Pro Influencer'].minScore &&
                completedCollabs >= tierRequirements['Pro Influencer'].minCollabs &&
                averageRating >= tierRequirements['Pro Influencer'].minRating &&
                completionRate >= tierRequirements['Pro Influencer'].minCompletion &&
                avgResponseHours <= tierRequirements['Pro Influencer'].maxResponseHours &&
                isVerified &&
                totalPenalties <= tierRequirements['Pro Influencer'].maxPenalties) {
                tier = 'Pro Influencer';
            } else if (totalScore >= tierRequirements['Trusted Collaborator'].minScore &&
                completedCollabs >= tierRequirements['Trusted Collaborator'].minCollabs &&
                averageRating >= tierRequirements['Trusted Collaborator'].minRating &&
                completionRate >= tierRequirements['Trusted Collaborator'].minCompletion &&
                avgResponseHours <= tierRequirements['Trusted Collaborator'].maxResponseHours &&
                totalPenalties <= tierRequirements['Trusted Collaborator'].maxPenalties) {
                tier = 'Trusted Collaborator';
            } else if (totalScore >= tierRequirements['Emerging Partner'].minScore &&
                completedCollabs >= tierRequirements['Emerging Partner'].minCollabs &&
                averageRating >= tierRequirements['Emerging Partner'].minRating &&
                completionRate >= tierRequirements['Emerging Partner'].minCompletion &&
                avgResponseHours <= tierRequirements['Emerging Partner'].maxResponseHours &&
                totalPenalties <= tierRequirements['Emerging Partner'].maxPenalties) {
                tier = 'Emerging Partner';
            }

            // Get current tier requirements for display
            const currentTierReqs = tierRequirements[tier] || tierRequirements['Rising Creator'];

            return {
                completedCollaborations: { count: completedCollabs, score: Math.ceil(scores.completed), maxScore: 25 },
                paidPromotions: { count: paidPromotions, score: Math.ceil(scores.paid), maxScore: 15 },
                averageRating: { value: Math.round(averageRating * 10) / 10, score: Math.round(scores.rating), maxScore: 25 },
                responseSpeed: { hours: Math.round(avgResponseHours * 10) / 10, score: Math.round(scores.response), maxScore: 10 },
                completionRate: { percentage: Math.round(completionRate * 10) / 10, score: Math.round(scores.completion), maxScore: 20 },
                verificationBonus: { isVerified, score: scores.verification, maxScore: 5 },
                penalties: { 
                    count: totalPenalties, 
                    score: Math.round(penaltyScore),
                    breakdown: {
                        cancellations: cancelledCollabs,
                        rejections: rejectedCollabs,
                        reports: reportsCount,
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
                    averageRating,
                    completionRate,
                    avgResponseHours,
                    isVerified,
                    totalPenalties
                ),
                requirementsMet: {
                    score: totalScore >= currentTierReqs.minScore,
                    completedCollabs: completedCollabs >= currentTierReqs.minCollabs,
                    rating: averageRating >= currentTierReqs.minRating,
                    completion: completionRate >= currentTierReqs.minCompletion,
                    responseTime: avgResponseHours <= currentTierReqs.maxResponseHours,
                    verified: currentTierReqs.verified ? isVerified : true,
                    penalties: totalPenalties <= currentTierReqs.maxPenalties,
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
     * Calculate progress towards next tier based on ALL requirements
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

        // Calculate progress for each requirement (0-100%)
        const progressMetrics: number[] = [];

        // Score progress
        const scoreRange = nextTierReqs.minScore - currentTierReqs.minScore;
        if (scoreRange > 0) {
            const scoreProgress = ((currentScore - currentTierReqs.minScore) / scoreRange) * 100;
            progressMetrics.push(Math.min(100, Math.max(0, scoreProgress)));
        }

        // Collaborations progress
        if (completedCollabs !== undefined) {
            const collabRange = nextTierReqs.minCollabs - currentTierReqs.minCollabs;
            if (collabRange > 0) {
                const collabProgress = ((completedCollabs - currentTierReqs.minCollabs) / collabRange) * 100;
                progressMetrics.push(Math.min(100, Math.max(0, collabProgress)));
            }
        }

        // Rating progress
        if (averageRating !== undefined) {
            const ratingRange = nextTierReqs.minRating - currentTierReqs.minRating;
            if (ratingRange > 0) {
                const ratingProgress = ((averageRating - currentTierReqs.minRating) / ratingRange) * 100;
                progressMetrics.push(Math.min(100, Math.max(0, ratingProgress)));
            }
        }

        // Completion rate progress
        if (completionRate !== undefined) {
            const completionRange = nextTierReqs.minCompletion - currentTierReqs.minCompletion;
            if (completionRange > 0) {
                const completionProgress = ((completionRate - currentTierReqs.minCompletion) / completionRange) * 100;
                progressMetrics.push(Math.min(100, Math.max(0, completionProgress)));
            }
        }

        // Response time progress (inverse - lower is better)
        if (avgResponseHours !== undefined && nextTierReqs.maxResponseHours < currentTierReqs.maxResponseHours) {
            const responseRange = currentTierReqs.maxResponseHours - nextTierReqs.maxResponseHours;
            const responseProgress = ((currentTierReqs.maxResponseHours - avgResponseHours) / responseRange) * 100;
            progressMetrics.push(Math.min(100, Math.max(0, responseProgress)));
        }

        // Verification (binary - 0% or 100%)
        if (nextTierReqs.verified && !currentTierReqs.verified) {
            progressMetrics.push(isVerified ? 100 : 0);
        }

        // Penalties (inverse - lower is better)
        if (totalPenalties !== undefined && nextTierReqs.maxPenalties < currentTierReqs.maxPenalties) {
            const penaltyRange = currentTierReqs.maxPenalties - nextTierReqs.maxPenalties;
            const penaltyProgress = ((currentTierReqs.maxPenalties - totalPenalties) / penaltyRange) * 100;
            progressMetrics.push(Math.min(100, Math.max(0, penaltyProgress)));
        }

        // Return average progress across all requirements
        if (progressMetrics.length === 0) {
            return 0;
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
                    minScore: 0,
                    requirements: {
                        completedCollabs: 0,
                        rating: 0,
                        completion: 0,
                        responseTime: 'Any',
                        verified: false,
                        maxPenalties: 'Unlimited',
                    },
                    benefits: ['Access to basic collaborations', 'Profile visibility', 'Community support'],
                },
                {
                    name: 'Emerging Partner',
                    description: 'Building your reputation with consistent quality',
                    minScore: 25,
                    requirements: {
                        completedCollabs: 3,
                        rating: 3.5,
                        completion: 75,
                        responseTime: '48 hours',
                        verified: false,
                        maxPenalties: 12,
                    },
                    benefits: ['Priority in search results', 'Access to more campaigns', 'Basic analytics'],
                },
                {
                    name: 'Trusted Collaborator',
                    description: 'Proven track record of reliable collaborations',
                    minScore: 45,
                    requirements: {
                        completedCollabs: 10,
                        rating: 4.0,
                        completion: 85,
                        responseTime: '36 hours',
                        verified: false,
                        maxPenalties: 8,
                    },
                    benefits: ['Featured in recommendations', 'Advanced analytics', 'Priority support'],
                },
                {
                    name: 'Pro Influencer',
                    description: 'Professional creator with verified excellence',
                    minScore: 65,
                    requirements: {
                        completedCollabs: 25,
                        rating: 4.3,
                        completion: 90,
                        responseTime: '24 hours',
                        verified: true,
                        maxPenalties: 5,
                    },
                    benefits: ['Premium campaign access', 'Higher visibility', 'Exclusive opportunities', 'Pro badge'],
                },
                {
                    name: 'Elite Creator',
                    description: 'Top-tier creator with exceptional performance',
                    minScore: 80,
                    requirements: {
                        completedCollabs: 50,
                        rating: 4.6,
                        completion: 95,
                        responseTime: '12 hours',
                        verified: true,
                        maxPenalties: 2,
                    },
                    benefits: ['VIP campaign invitations', 'Maximum visibility', 'Dedicated account manager', 'Elite badge'],
                },
                {
                    name: 'Kollabary Icon',
                    description: 'The pinnacle of creator excellence',
                    minScore: 92,
                    requirements: {
                        completedCollabs: 100,
                        rating: 4.8,
                        completion: 98,
                        responseTime: '6 hours',
                        verified: true,
                        maxPenalties: 0,
                    },
                    benefits: ['Exclusive brand partnerships', 'Featured on platform', 'Premium support', 'Icon badge', 'Revenue share bonuses'],
                },
            ],
            scoringGuide: {
                completedCollaborations: {
                    description: 'Total number of successfully completed collaborations',
                    maxPoints: 25,
                    calculation: 'Diminishing returns curve: 1→5pts, 5→11pts, 10→16pts, 25→25pts, 50+→max',
                    tips: ['Complete all accepted collaborations', 'Deliver quality work on time', 'Maintain good communication'],
                },
                paidPromotions: {
                    description: 'Number of paid promotional collaborations',
                    maxPoints: 15,
                    calculation: 'Diminishing returns curve: 1→6pts, 5→13pts, 10→15pts, 25+→max',
                    tips: ['Focus on paid opportunities', 'Build relationships with brands', 'Showcase your value'],
                },
                averageRating: {
                    description: 'Average rating from all your reviews',
                    maxPoints: 25,
                    calculation: '5.0 rating = 25 points (linear scale)',
                    tips: ['Exceed expectations', 'Communicate proactively', 'Deliver high-quality content'],
                },
                completionRate: {
                    description: 'Percentage of accepted collaborations you complete',
                    maxPoints: 20,
                    calculation: '100% completion = 20 points',
                    tips: ['Only accept what you can deliver', 'Avoid cancellations', 'Finish all projects'],
                },
                responseSpeed: {
                    description: 'Average time to respond to collaboration requests',
                    maxPoints: 10,
                    calculation: 'Under 6 hours = 10 points (decreases to 0 at 48h)',
                    tips: ['Enable notifications', 'Check regularly', 'Respond promptly'],
                },
                verificationBonus: {
                    description: 'Bonus for verified account status',
                    maxPoints: 5,
                    calculation: 'Verified = 5 points',
                    tips: ['Complete verification process', 'Submit required documents', 'Maintain account security'],
                },
                penalties: {
                    description: 'Deductions for negative behaviors',
                    impact: 'Cancellations: -25 each, Rejections: -15 each, Low ratings: -50',
                    tips: ['Avoid cancellations', 'Accept selectively', 'Maintain quality standards'],
                },
            },
        };
    }

    /**
     * Update ranking score for an influencer
     * @param influencerId - User ID of the influencer
     * @returns Updated influencer profile
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

            // Update ranking score and related fields
            profile.rankingScore = breakdown.totalScore;
            profile.rankingTier = breakdown.rankingTier;
            profile.avgRating = breakdown.averageRating.value;
            profile.totalReviews = await this.reviewRepo.count({
                where: { influencer: { id: profile.id } },
            });

            await this.influencerRepo.save(profile);

            this.logger.log(`Updated ranking for influencer ${influencerId}: ${breakdown.rankingTier} (${breakdown.totalScore})`);

            return profile;
        } catch (error) {
            this.logger.error(`Error updating ranking for influencer ${influencerId}:`, error);
            throw error;
        }
    }

    /**
     * Recalculate rankings for all influencers
     * Runs daily at midnight
     */
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async recalculateAllRankings(): Promise<void> {
        this.logger.log('Starting daily ranking recalculation...');

        try {
            const influencers = await this.influencerRepo.find({
                relations: ['user'],
            });

            let successCount = 0;
            let errorCount = 0;

            for (const influencer of influencers) {
                try {
                    await this.updateRanking(influencer.user.id);
                    successCount++;
                } catch (error) {
                    errorCount++;
                    this.logger.error(
                        `Failed to update ranking for influencer ${influencer.user.id}:`,
                        error.message
                    );
                }
            }

            this.logger.log(
                `Ranking recalculation complete. Success: ${successCount}, Errors: ${errorCount}`
            );
        } catch (error) {
            this.logger.error('Error during ranking recalculation:', error);
        }
    }

    /**
     * Get ranking breakdown for an influencer
     * @param influencerId - User ID of the influencer
     * @returns Ranking breakdown
     */
    async getRankingBreakdown(influencerId: string): Promise<RankingBreakdownDto> {
        return this.calculateRanking(influencerId);
    }

    /**
     * Update ranking weights (admin only)
     * @param weights - New weight values
     */
    updateWeights(weights: Partial<RankingWeights>): void {
        this.weights = { ...this.weights, ...weights };
        this.logger.log('Ranking weights updated:', this.weights);
    }

    /**
     * Get current ranking weights
     * @returns Current weights
     */
    getWeights(): RankingWeightsDto {
        return { ...this.weights };
    }
}
