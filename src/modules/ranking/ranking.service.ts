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
            cancellationPenalty: 0,
            rejectionPenalty: 0,
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
                    completedCollaborations: { count: 0, score: 0 },
                    paidPromotions: { count: 0, score: 0 },
                    averageRating: { value: 0, score: 0 },
                    responseSpeed: { hours: 24, score: 0 },
                    completionRate: { percentage: 0, score: 0 },
                    verificationBonus: { isVerified: false, score: 0 },
                    penalties: { count: 0, score: 0 },
                    totalScore: 0,
                    rankingTier: 'Newbie',
                    requirementsMet: {},
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

            // --- Normalized Score Calculation (0-100) ---
            // Max scores for each metric:
            // Completed Collabs: 50+ -> 20 pts
            // Paid Promotions: 20+ -> 10 pts
            // Avg Rating: 5.0 -> 30 pts
            // Completion Rate: 100% -> 15 pts
            // Response Speed: <12h -> 15 pts
            // Verification: true -> 10 pts (Bonus)

            const scores = {
                completed: Math.min(20, (completedCollabs / 50) * 20),
                paid: Math.min(10, (paidPromotions / 20) * 10),
                rating: (averageRating / 5.0) * 30,
                completion: (completionRate / 100) * 15,
                response: avgResponseHours < 12 ? 15 : avgResponseHours > 48 ? 0 : ((48 - avgResponseHours) / 36) * 15,
                verification: isVerified ? 10 : 0,
            };

            let totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
            totalScore = Math.min(100, Math.round(totalScore));

            // --- Tier Determination (Score-Based) ---
            let tier = 'Rising Creator';
            if (totalScore >= 90) tier = 'Kollabary Icon';
            else if (totalScore >= 75) tier = 'Elite Creator';
            else if (totalScore >= 60) tier = 'Pro Influencer';
            else if (totalScore >= 40) tier = 'Trusted Collaborator';
            else if (totalScore >= 20) tier = 'Emerging Partner';

            return {
                completedCollaborations: { count: completedCollabs, score: Math.round(scores.completed) },
                paidPromotions: { count: paidPromotions, score: Math.round(scores.paid) },
                averageRating: { value: Math.round(averageRating * 10) / 10, score: Math.round(scores.rating) },
                responseSpeed: { hours: Math.round(avgResponseHours * 10) / 10, score: Math.round(scores.response) },
                completionRate: { percentage: Math.round(completionRate * 10) / 10, score: Math.round(scores.completion) },
                verificationBonus: { isVerified, score: scores.verification },
                penalties: { count: reportsCount, score: reportsCount > 0 ? -10 : 0 },
                totalScore,
                rankingTier: tier,
                requirementsMet: {
                    completedCollabs: completedCollabs >= (tier === 'Kollabary Icon' ? 50 : tier === 'Elite Creator' ? 30 : tier === 'Pro Influencer' ? 15 : tier === 'Trusted Collaborator' ? 8 : tier === 'Emerging Partner' ? 3 : 1),
                    rating: averageRating >= (tier === 'Kollabary Icon' ? 4.7 : tier === 'Elite Creator' ? 4.5 : tier === 'Pro Influencer' ? 4.2 : tier === 'Trusted Collaborator' ? 4.0 : 3.5),
                    completion: completionRate >= (tier === 'Kollabary Icon' ? 95 : tier === 'Elite Creator' ? 90 : 80),
                    verified: tier === 'Rising Creator' ? true : isVerified, // Simple check
                    zeroFraud: reportsCount === 0,
                }
            };
        } catch (error) {
            this.logger.error(`Error calculating ranking for influencer ${influencerId}:`, error);
            throw error;
        }
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
