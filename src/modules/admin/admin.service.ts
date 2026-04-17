import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { Collaboration } from '../../database/entities/collaboration.entity';
import { VerificationRequest } from '../../database/entities/verification-request.entity';
import { Review } from '../../database/entities/review.entity';
import { Auction } from '../../database/entities/auction.entity';
import { Bid } from '../../database/entities/bid.entity';
import { Conversation } from '../../database/entities/conversation.entity';
import { Message } from '../../database/entities/message.entity';
import { UserRole, CollaborationStatus, VerificationStatus, AuctionStatus } from '../../database/entities/enums';
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
        @InjectRepository(Auction)
        private readonly auctionRepo: Repository<Auction>,
        @InjectRepository(Bid)
        private readonly bidRepo: Repository<Bid>,
        @InjectRepository(Conversation)
        private readonly conversationRepo: Repository<Conversation>,
        @InjectRepository(Message)
        private readonly messageRepo: Repository<Message>,
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
        const eightWeeksAgo = new Date(now.getTime() - 8 * 7 * 24 * 60 * 60 * 1000);

        // Fetch counts for each entity grouped by week in a single efficient query
        // Using raw SQL for PostgreSQL as TypeORM's groupBy with date_trunc is complex
        const [userResults, collabResults, reviewResults] = await Promise.all([
            this.userRepo.query(`
                SELECT date_trunc('week', "createdAt") as week, count(*)::int as count
                FROM users 
                WHERE "createdAt" >= $1
                GROUP BY week 
                ORDER BY week ASC
            `, [eightWeeksAgo]),
            this.collaborationRepo.query(`
                SELECT date_trunc('week', "createdAt") as week, count(*)::int as count
                FROM collaborations
                WHERE "createdAt" >= $1
                GROUP BY week 
                ORDER BY week ASC
            `, [eightWeeksAgo]),
            this.reviewRepo.query(`
                SELECT date_trunc('week', "createdAt") as week, count(*)::int as count
                FROM reviews
                WHERE "createdAt" >= $1
                GROUP BY week 
                ORDER BY week ASC
            `, [eightWeeksAgo]),
        ]);

        // Helper to format results into buckets
        // Since we want 8 specific weeks, we iterate and match
        for (let i = 7; i >= 0; i--) {
            const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
            const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
            
            const findCount = (results: any[]) => {
                const match = results.find(r => {
                    const d = new Date(r.week);
                    return d >= weekStart && d < weekEnd;
                });
                return match ? match.count : 0;
            };

            growth.push({
                week: `Week ${8 - i}`,
                newUsers: findCount(userResults),
                newCollaborations: findCount(collabResults),
                newReviews: findCount(reviewResults),
            });
        }

        return growth;
    }

    /**
     * Get all auctions in the system
     */
    async getAllAuctions(search?: string, status?: AuctionStatus) {
        const query = this.auctionRepo.createQueryBuilder('auction')
            .leftJoinAndSelect('auction.creator', 'creator')
            .leftJoinAndSelect('creator.profile', 'profile')
            .leftJoinAndSelect('creator.influencerProfile', 'influencerProfile')
            .leftJoinAndSelect('auction.bids', 'bids')
            .orderBy('auction.createdAt', 'DESC');

        if (status) {
            query.andWhere('auction.status = :status', { status });
        }

        if (search) {
            query.andWhere(
                '(auction.title ILike :search OR profile.fullName ILike :search)',
                { search: `%${search}%` }
            );
        }

        return await query.getMany();
    }

    /**
     * Get all bids in the system
     */
    async getAllBids(search?: string) {
        const query = this.bidRepo.createQueryBuilder('bid')
            .leftJoinAndSelect('bid.influencer', 'influencer')
            .leftJoinAndSelect('influencer.profile', 'profile')
            .leftJoinAndSelect('influencer.influencerProfile', 'influencerProfile')
            .leftJoinAndSelect('bid.auction', 'auction')
            .orderBy('bid.createdAt', 'DESC');

        if (search) {
            query.andWhere(
                '(profile.fullName ILike :search OR auction.title ILike :search)',
                { search: `%${search}%` }
            );
        }

        return await query.getMany();
    }

    /**
     * Get all conversations in the system
     */
    async getAllConversations() {
        return await this.conversationRepo.find({
            relations: [
                'userOne', 
                'userTwo', 
                'userOne.profile', 
                'userTwo.profile',
                'userOne.influencerProfile',
                'userTwo.influencerProfile'
            ],
            order: { lastMessageAt: 'DESC' },
        });
    }

    /**
     * Get all messages for a specific conversation (Admin View)
     */
    async getConversationMessages(conversationId: string) {
        return await this.messageRepo.find({
            where: { conversation: { id: conversationId } },
            relations: ['sender', 'sender.profile', 'sender.influencerProfile'],
            order: { createdAt: 'ASC' },
        });
    }
}
