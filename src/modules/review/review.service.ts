import { Injectable, NotFoundException, BadRequestException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Review } from '../../database/entities/review.entity';
import { Collaboration } from '../../database/entities/collaboration.entity';
import { InfluencerProfile } from '../../database/entities/influencer-profile.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { CollaborationStatus } from '../../database/entities/enums';
import { isEntityNotFoundError } from '../../database/errors/entity-not-found.type-guard';
import { cif } from '../../database/errors/tryQuery';

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
        const collaboration = await this.collaborationRepo.findOne({
            where: { id: createDto.collaborationId },
            relations: ['requester', 'influencer'],
        });

        if (!collaboration) {
            throw new NotFoundException('Collaboration not found');
        }

        if (collaboration.requester.id !== reviewerId) {
            throw new ForbiddenException('Only the requester can leave a review');
        }

        if (collaboration.status !== CollaborationStatus.COMPLETED) {
            throw new BadRequestException('Reviews can only be left for completed collaborations');
        }

        // Check if review already exists
        const existingReview = await this.reviewRepo.findOne({
            where: { collaboration: { id: collaboration.id } },
        });
        if (existingReview) {
            throw new BadRequestException('A review has already been submitted for this collaboration');
        }

        return await this.dataSource.transaction(async (manager) => {
            const review = manager.create(Review, {
                reviewer: { id: reviewerId } as any,
                influencer: { id: collaboration.influencer.id } as any,
                collaboration: { id: collaboration.id } as any,
                rating: createDto.rating,
                comment: createDto.comment,
            });

            const savedReview = await manager.save(Review, review);

            // Update Influencer Rating within the same transaction
            const influencerProfile = await manager.findOne(InfluencerProfile, {
                where: { user: { id: collaboration.influencer.id } },
            });

            if (influencerProfile) {
                const reviews = await manager.find(Review, {
                    where: { influencer: { id: collaboration.influencer.id } },
                });

                // Note: savedReview is already in the DB but transaction is not committed.
                // Depending on isolation level, we might need to manually add savedReview if find doesn't return it yet,
                // but usually find within transaction works. To be safe/accurate:
                const allReviews = [...reviews];
                const total = allReviews.length;
                const sum = allReviews.reduce((acc, r) => acc + r.rating, 0);

                influencerProfile.avgRating = Number((sum / total).toFixed(1));
                influencerProfile.totalReviews = total;

                await manager.save(InfluencerProfile, influencerProfile);
            }

            return savedReview;
        });
    }

    async getInfluencerReviews(influencerUserId: string): Promise<Review[]> {
        return await this.reviewRepo.find({
            where: { influencer: { id: influencerUserId } },
            relations: ['reviewer', 'reviewer.profile'],
            order: { createdAt: 'DESC' },
        });
    }

}
