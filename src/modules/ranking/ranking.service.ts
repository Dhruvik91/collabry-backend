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
            cancellationPenalty: -50,
            rejectionPenalty: -30,
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
                throw new NotFoundException('Influencer profile not found');
            }

            // 1. Calculate completed collaborations
            const completedCollabs = await this.collaborationRepo.count({
                where: {
                    influencer: { id: influencerId },
                    status: CollaborationStatus.COMPLETED,
                },
            });

            // 2. Calculate paid promotions (for now, same as completed)
            // TODO: Add collaboration type field to distinguish paid promotions
            const paidPromotions = completedCollabs;

            // 3. Calculate average rating
            const reviews = await this.reviewRepo.find({
                where: { influencer: { id: influencerId } },
                select: ['rating'],
            });

            const averageRating = reviews.length > 0
                ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
                : 0;

            // 4. Calculate response speed (average hours to accept/reject)
            const recentCollabs = await this.collaborationRepo
                .createQueryBuilder('collab')
                .where('collab.influencerId = :influencerId', { influencerId })
                .andWhere('collab.status IN (:...statuses)', {
                    statuses: [
                        CollaborationStatus.ACCEPTED,
                        CollaborationStatus.REJECTED,
                        CollaborationStatus.IN_PROGRESS,
                        CollaborationStatus.COMPLETED,
                    ],
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

            const avgResponseHours = responseCount > 0 ? totalResponseTime / responseCount : 24;

            // 5. Calculate completion rate
            const acceptedCollabs = await this.collaborationRepo.count({
                where: {
                    influencer: { id: influencerId },
                    status: In([
                        CollaborationStatus.ACCEPTED,
                        CollaborationStatus.IN_PROGRESS,
                        CollaborationStatus.COMPLETED,
                    ]),
                },
            });

            const completionRate = acceptedCollabs > 0 ? (completedCollabs / acceptedCollabs) * 100 : 0;

            // 6. Verification status
            const isVerified = influencer.verified || false;

            // 7. Calculate penalties
            const cancelledCollabs = await this.collaborationRepo.count({
                where: {
                    influencer: { id: influencerId },
                    status: CollaborationStatus.CANCELLED,
                },
            });

            const rejectedCollabs = await this.collaborationRepo.count({
                where: {
                    influencer: { id: influencerId },
                    status: CollaborationStatus.REJECTED,
                },
            });

            // Calculate individual scores
            const breakdown: RankingBreakdownDto = {
                completedCollaborations: {
                    count: completedCollabs,
                    score: completedCollabs * this.weights.completedCollaborations,
                },
                paidPromotions: {
                    count: paidPromotions,
                    score: paidPromotions * this.weights.paidPromotions,
                },
                averageRating: {
                    value: Math.round(averageRating * 10) / 10, // Round to 1 decimal
                    score: averageRating * this.weights.averageRating,
                },
                responseSpeed: {
                    hours: Math.round(avgResponseHours * 10) / 10,
                    score: Math.max(0, (100 - avgResponseHours / 24) * this.weights.responseSpeed),
                },
                completionRate: {
                    percentage: Math.round(completionRate * 10) / 10,
                    score: (completionRate / 100) * this.weights.completionRate,
                },
                verificationBonus: {
                    isVerified,
                    score: isVerified ? this.weights.verificationBonus : 0,
                },
                penalties: {
                    count: cancelledCollabs + rejectedCollabs,
                    score:
                        cancelledCollabs * this.weights.cancellationPenalty +
                        rejectedCollabs * this.weights.rejectionPenalty +
                        (averageRating < 3.0 && reviews.length > 0 ? this.weights.lowRatingPenalty : 0),
                },
                totalScore: 0,
            };

            // Calculate total score
            breakdown.totalScore = Math.round(
                breakdown.completedCollaborations.score +
                breakdown.paidPromotions.score +
                breakdown.averageRating.score +
                breakdown.responseSpeed.score +
                breakdown.completionRate.score +
                breakdown.verificationBonus.score +
                breakdown.penalties.score
            );

            return breakdown;
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
            });

            if (!profile) {
                throw new NotFoundException('Influencer profile not found');
            }

            // Update ranking score and related fields
            profile.rankingScore = breakdown.totalScore;
            profile.avgRating = breakdown.averageRating.value;
            profile.totalReviews = await this.reviewRepo.count({
                where: { influencer: { id: influencerId } },
            });

            await this.influencerRepo.save(profile);

            this.logger.log(`Updated ranking for influencer ${influencerId}: ${breakdown.totalScore}`);

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
