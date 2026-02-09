import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { Collaboration } from '../../database/entities/collaboration.entity';
import { VerificationRequest } from '../../database/entities/verification-request.entity';
import { Review } from '../../database/entities/review.entity';
import { UserRole, CollaborationStatus, VerificationStatus } from '../../database/entities/enums';
import {
    AdminStatsDto,
    UserStatsDto,
    CollaborationStatsDto,
    VerificationStatsDto,
    ReviewStatsDto,
    PlatformGrowthDto,
} from './dto/admin-stats.dto';

@Injectable()
export class AdminService {
    private readonly logger = new Logger(AdminService.name);

    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        @InjectRepository(Collaboration)
        private readonly collaborationRepo: Repository<Collaboration>,
        @InjectRepository(VerificationRequest)
        private readonly verificationRepo: Repository<VerificationRequest>,
        @InjectRepository(Review)
        private readonly reviewRepo: Repository<Review>,
    ) { }

    /**
     * Get comprehensive platform statistics
     * @returns Platform statistics
     */
    async getStatistics(): Promise<AdminStatsDto> {
        try {
            const [users, collaborations, verifications, reviews, growth] = await Promise.all([
                this.getUserStats(),
                this.getCollaborationStats(),
                this.getVerificationStats(),
                this.getReviewStats(),
                this.getGrowthStats(),
            ]);

            return {
                users,
                collaborations,
                verifications,
                reviews,
                growth,
            };
        } catch (error) {
            this.logger.error('Error fetching admin statistics:', error);
            throw error;
        }
    }

    /**
     * Get user statistics
     * @returns User stats
     */
    private async getUserStats(): Promise<UserStatsDto> {
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const [
            totalUsers,
            regularUsers,
            influencers,
            admins,
            newUsersThisWeek,
            newUsersThisMonth,
        ] = await Promise.all([
            this.userRepo.count(),
            this.userRepo.count({ where: { role: UserRole.USER } }),
            this.userRepo.count({ where: { role: UserRole.INFLUENCER } }),
            this.userRepo.count({ where: { role: UserRole.ADMIN } }),
            this.userRepo.count({ where: { createdAt: MoreThan(oneWeekAgo) } }),
            this.userRepo.count({ where: { createdAt: MoreThan(oneMonthAgo) } }),
        ]);

        return {
            totalUsers,
            regularUsers,
            influencers,
            admins,
            newUsersThisWeek,
            newUsersThisMonth,
        };
    }

    /**
     * Get collaboration statistics
     * @returns Collaboration stats
     */
    private async getCollaborationStats(): Promise<CollaborationStatsDto> {
        const [
            totalCollaborations,
            activeCollaborations,
            completedCollaborations,
            pendingRequests,
            cancelledCollaborations,
        ] = await Promise.all([
            this.collaborationRepo.count(),
            this.collaborationRepo.count({
                where: { status: CollaborationStatus.IN_PROGRESS },
            }),
            this.collaborationRepo.count({
                where: { status: CollaborationStatus.COMPLETED },
            }),
            this.collaborationRepo.count({
                where: { status: CollaborationStatus.REQUESTED },
            }),
            this.collaborationRepo.count({
                where: { status: CollaborationStatus.CANCELLED },
            }),
        ]);

        const completionRate =
            totalCollaborations > 0
                ? Math.round((completedCollaborations / totalCollaborations) * 1000) / 10
                : 0;

        return {
            totalCollaborations,
            activeCollaborations,
            completedCollaborations,
            pendingRequests,
            cancelledCollaborations,
            completionRate,
        };
    }

    /**
     * Get verification statistics
     * @returns Verification stats
     */
    private async getVerificationStats(): Promise<VerificationStatsDto> {
        const [totalRequests, pendingRequests, approvedRequests, rejectedRequests] =
            await Promise.all([
                this.verificationRepo.count(),
                this.verificationRepo.count({
                    where: { status: VerificationStatus.PENDING },
                }),
                this.verificationRepo.count({
                    where: { status: VerificationStatus.APPROVED },
                }),
                this.verificationRepo.count({
                    where: { status: VerificationStatus.REJECTED },
                }),
            ]);

        const approvalRate =
            approvedRequests + rejectedRequests > 0
                ? Math.round(
                    (approvedRequests / (approvedRequests + rejectedRequests)) * 1000
                ) / 10
                : 0;

        return {
            totalRequests,
            pendingRequests,
            approvedRequests,
            rejectedRequests,
            approvalRate,
        };
    }

    /**
     * Get review statistics
     * @returns Review stats
     */
    private async getReviewStats(): Promise<ReviewStatsDto> {
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const [totalReviews, reviewsThisWeek, reviewsThisMonth, allReviews] =
            await Promise.all([
                this.reviewRepo.count(),
                this.reviewRepo.count({ where: { createdAt: MoreThan(oneWeekAgo) } }),
                this.reviewRepo.count({ where: { createdAt: MoreThan(oneMonthAgo) } }),
                this.reviewRepo.find({ select: ['rating'] }),
            ]);

        const averageRating =
            allReviews.length > 0
                ? Math.round(
                    (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length) * 10
                ) / 10
                : 0;

        return {
            totalReviews,
            averageRating,
            reviewsThisWeek,
            reviewsThisMonth,
        };
    }

    /**
     * Get platform growth statistics for the last 8 weeks
     * @returns Growth stats
     */
    private async getGrowthStats(): Promise<PlatformGrowthDto[]> {
        const growth: PlatformGrowthDto[] = [];
        const now = new Date();

        for (let i = 7; i >= 0; i--) {
            const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
            const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);

            const [newUsers, newCollaborations, newReviews] = await Promise.all([
                this.userRepo.count({
                    where: {
                        createdAt: MoreThan(weekStart),
                    },
                }),
                this.collaborationRepo.count({
                    where: {
                        createdAt: MoreThan(weekStart),
                    },
                }),
                this.reviewRepo.count({
                    where: {
                        createdAt: MoreThan(weekStart),
                    },
                }),
            ]);

            // Subtract previous week's count to get only this week's data
            const prevWeekStart = new Date(
                now.getTime() - (i + 2) * 7 * 24 * 60 * 60 * 1000
            );
            const [prevUsers, prevCollabs, prevReviews] = await Promise.all([
                this.userRepo.count({ where: { createdAt: MoreThan(prevWeekStart) } }),
                this.collaborationRepo.count({
                    where: { createdAt: MoreThan(prevWeekStart) },
                }),
                this.reviewRepo.count({ where: { createdAt: MoreThan(prevWeekStart) } }),
            ]);

            growth.push({
                week: `Week ${8 - i}`,
                newUsers: newUsers - prevUsers,
                newCollaborations: newCollaborations - prevCollabs,
                newReviews: newReviews - prevReviews,
            });
        }

        return growth;
    }
}
