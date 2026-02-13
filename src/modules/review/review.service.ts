import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Review } from '../../database/entities/review.entity';
import { Collaboration } from '../../database/entities/collaboration.entity';
import { InfluencerProfile } from '../../database/entities/influencer-profile.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { CollaborationStatus } from '../../database/entities/enums';

@Injectable()
export class ReviewService {
    constructor(
        @InjectRepository(Review)
        private readonly reviewRepo: Repository<Review>,
        @InjectRepository(Collaboration)
        private readonly collaborationRepo: Repository<Collaboration>,
        @InjectRepository(InfluencerProfile)
        private readonly influencerProfileRepo: Repository<InfluencerProfile>,
        private readonly dataSource: DataSource,
    ) { }

    async createReview(reviewerId: string, createDto: CreateReviewDto): Promise<Review> {
        // Resolve influencer Profile ID if a user ID was passed
        let targetInfluencerProfileId = createDto.influencerId;

        // If the ID provided is not a profile ID but a user ID, find the profile
        const profileByUserId = await this.influencerProfileRepo.findOne({
            where: { user: { id: createDto.influencerId } }
        });

        if (profileByUserId) {
            targetInfluencerProfileId = profileByUserId.id;
        }

        // Ensure we actually have a profile ID now
        const profile = await this.influencerProfileRepo.findOne({
            where: { id: targetInfluencerProfileId },
            relations: ['user']
        });

        if (!profile) {
            throw new NotFoundException('Influencer profile not found');
        }

        const targetInfluencerUserId = profile.user.id;

        let collaboration: Collaboration;

        if (createDto.collaborationId) {
            collaboration = await this.collaborationRepo.findOne({
                where: { id: createDto.collaborationId },
                relations: ['requester', 'influencer'],
            });
        } else {
            // Find a completed collaboration between these two
            collaboration = await this.collaborationRepo.findOne({
                where: {
                    requester: { id: reviewerId },
                    influencer: { id: targetInfluencerUserId },
                    status: CollaborationStatus.COMPLETED,
                },
                relations: ['requester', 'influencer'],
                order: { updatedAt: 'DESC' }
            });

            if (!collaboration) {
                // For demo/testing purposes, if no completed one, try any collaboration
                collaboration = await this.collaborationRepo.findOne({
                    where: {
                        requester: { id: reviewerId },
                        influencer: { id: targetInfluencerUserId },
                    },
                    relations: ['requester', 'influencer'],
                    order: { updatedAt: 'DESC' }
                });
            }
        }

        if (!collaboration) {
            throw new BadRequestException('No valid collaboration found to review. You must have a collaboration with this influencer.');
        }

        if (collaboration.requester.id !== reviewerId) {
            throw new ForbiddenException('Only the requester can leave a review');
        }

        // Check if review already exists for this collaboration
        const existingReview = await this.reviewRepo.findOne({
            where: { collaboration: { id: collaboration.id } },
        });
        if (existingReview) {
            throw new BadRequestException('A review has already been submitted for this collaboration');
        }

        return await this.dataSource.transaction(async (manager) => {
            const review = manager.create(Review, {
                reviewer: { id: reviewerId } as any,
                influencer: { id: targetInfluencerProfileId } as any,
                collaboration: { id: collaboration.id } as any,
                rating: createDto.rating,
                comment: createDto.comment,
            });

            const savedReview = await manager.save(Review, review);

            // Update Influencer Rating within the same transaction using aggregate query
            const influencerProfile = await manager.findOne(InfluencerProfile, {
                where: { id: targetInfluencerProfileId },
            });

            if (influencerProfile) {
                const stats = await manager
                    .createQueryBuilder(Review, 'review')
                    .select('AVG(review.rating)', 'avg')
                    .addSelect('COUNT(review.id)', 'count')
                    .where('review.influencerId = :influencerProfileId', {
                        influencerProfileId: targetInfluencerProfileId,
                    })
                    .getRawOne();

                influencerProfile.avgRating = Number(Number(stats.avg || 0).toFixed(1));
                influencerProfile.totalReviews = Number(stats.count || 0);

                await manager.save(InfluencerProfile, influencerProfile);
            }

            return savedReview;
        });
    }

    async getInfluencerReviews(influencerProfileId: string): Promise<Review[]> {
        return await this.reviewRepo.find({
            where: { influencer: { id: influencerProfileId } },
            relations: ['reviewer', 'reviewer.profile'],
            order: { createdAt: 'DESC' },
        });
    }

    async updateReview(userId: string, id: string, updateDto: Partial<CreateReviewDto>): Promise<Review> {
        const review = await this.reviewRepo.findOne({
            where: { id },
            relations: ['reviewer', 'influencer'],
        });

        if (!review) {
            throw new NotFoundException('Review not found');
        }

        if (review.reviewer.id !== userId) {
            throw new ForbiddenException('You can only update your own reviews');
        }

        if (updateDto.rating) review.rating = updateDto.rating;
        if (updateDto.comment) review.comment = updateDto.comment;

        const savedReview = await this.reviewRepo.save(review);
        await this.updateInfluencerAverageRating(review.influencer.id);
        return savedReview;
    }

    async deleteReview(userId: string, id: string): Promise<void> {
        const review = await this.reviewRepo.findOne({
            where: { id },
            relations: ['reviewer', 'influencer'],
        });

        if (!review) {
            throw new NotFoundException('Review not found');
        }

        if (review.reviewer.id !== userId) {
            throw new ForbiddenException('You can only delete your own reviews');
        }

        const influencerProfileId = review.influencer.id;
        await this.reviewRepo.remove(review);
        await this.updateInfluencerAverageRating(influencerProfileId);
    }

    private async updateInfluencerAverageRating(influencerProfileId: string): Promise<void> {
        const stats = await this.reviewRepo
            .createQueryBuilder('review')
            .select('AVG(review.rating)', 'avg')
            .addSelect('COUNT(review.id)', 'count')
            .where('review.influencerId = :influencerProfileId', { influencerProfileId })
            .getRawOne();

        const influencerProfile = await this.influencerProfileRepo.findOne({
            where: { id: influencerProfileId },
        });

        if (influencerProfile) {
            influencerProfile.avgRating = Number(Number(stats.avg || 0).toFixed(1));
            influencerProfile.totalReviews = Number(stats.count || 0);
            await this.influencerProfileRepo.save(influencerProfile);
        }
    }
}
