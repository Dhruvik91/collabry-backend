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
import { UserRole, CollaborationStatus, VerificationStatus, AuctionStatus, UserStatus } from '../../database/entities/enums';
import {
    AdminStatsDto,
    UserStatsDto,
    CollaborationStatsDto,
    VerificationStatsDto,
    ReviewStatsDto,
    PlatformGrowthDto,
    FinanceStatsDto,
    TrendPointDto,
} from './dto/admin-stats.dto';
import { 
    AdminFinanceFilterDto, 
    DateRangeType, 
    AdminOrderFilterDto, 
    AdminUserFilterDto, 
    AdminBulkStatusDto,
    AdminUpdateVerificationDto
} from './dto/admin-management.dto';
import { PaymentOrder } from '../../database/entities/payment-order.entity';
import { PaymentStatus } from '../../database/entities/enums';
import { Between, ILike } from 'typeorm';

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
        @InjectRepository(PaymentOrder)
        private readonly orderRepo: Repository<PaymentOrder>,
    ) { }

    /**
     * Get comprehensive platform statistics
     * @returns Platform statistics
     */
    async getStatistics(filter?: AdminFinanceFilterDto): Promise<AdminStatsDto> {
        try {
            const [users, collaborations, verifications, reviews, growth, finance] = await Promise.all([
                this.getUserStats(),
                this.getCollaborationStats(),
                this.getVerificationStats(),
                this.getReviewStats(),
                this.getGrowthStats(),
                this.getFinanceStats(filter),
            ]);

            return {
                users,
                collaborations,
                verifications,
                reviews,
                growth,
                finance,
            };
        } catch (error) {
            this.logger.error('Error fetching admin statistics:', error);
            throw error;
        }
    }

    /**
     * Get financial statistics with dynamic aggregation
     */
    async getFinanceStats(filter?: AdminFinanceFilterDto): Promise<FinanceStatsDto> {
        const { startDate, endDate } = this.calculateDateRange(filter);

        // 1. Basic Stats
        const [successOrders, totalOrders] = await Promise.all([
            this.orderRepo.find({
                where: {
                    status: PaymentStatus.SUCCESS,
                    createdAt: Between(startDate, endDate),
                },
            }),
            this.orderRepo.count({
                where: {
                    createdAt: Between(startDate, endDate),
                },
            }),
        ]);

        const totalRevenue = successOrders.reduce((sum, o) => sum + Number(o.amount), 0);
        const totalCoinsSold = successOrders.reduce((sum, o) => sum + o.coins, 0);
        const successRate = totalOrders > 0 ? (successOrders.length / totalOrders) * 100 : 0;

        // 2. Trends with Dynamic Aggregation level
        const diffMs = endDate.getTime() - startDate.getTime();
        const diffMonths = diffMs / (1000 * 60 * 60 * 24 * 30);
        
        let interval = 'day';
        if (diffMonths >= 2 && diffMonths <= 12) interval = 'week';
        else if (diffMonths > 12) interval = 'month';

        const trendsRaw = await this.orderRepo.query(`
            SELECT date_trunc('${interval}', "createdAt") as label, SUM(amount)::float as value
            FROM payment_orders
            WHERE status = 'SUCCESS' AND "createdAt" BETWEEN $1 AND $2
            GROUP BY label
            ORDER BY label ASC
        `, [startDate, endDate]);

        const revenueTrends = trendsRaw.map(t => ({
            label: new Date(t.label).toLocaleDateString(),
            value: t.value,
        }));

        return {
            totalRevenue,
            totalCoinsSold,
            orderCount: totalOrders,
            successRate,
            revenueTrends,
        };
    }

    private calculateDateRange(filter?: AdminFinanceFilterDto): { startDate: Date, endDate: Date } {
        const now = new Date();
        let startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Default Today
        let endDate = new Date();

        if (!filter) return { startDate, endDate };

        switch (filter.range) {
            case DateRangeType.TODAY:
                startDate = new Date(now.setHours(0, 0, 0, 0));
                break;
            case DateRangeType.THIS_WEEK:
                startDate = new Date(now.setDate(now.getDate() - now.getDay()));
                break;
            case DateRangeType.THIS_MONTH:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case DateRangeType.LAST_MONTH:
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                endDate = new Date(now.getFullYear(), now.getMonth(), 0);
                break;
            case DateRangeType.THIS_YEAR:
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            case DateRangeType.LAST_YEAR:
                startDate = new Date(now.getFullYear() - 1, 0, 1);
                endDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
                break;
            case DateRangeType.CUSTOM:
                if (filter.startDate) startDate = new Date(filter.startDate);
                if (filter.endDate) endDate = new Date(filter.endDate);
                break;
        }

        return { startDate, endDate };
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
    async getAllOrders(filters: AdminOrderFilterDto) {
        const { page = 1, limit = 20, status, userId, planId, startDate, endDate, search } = filters;
        const query = this.orderRepo.createQueryBuilder('order')
            .leftJoinAndSelect('order.user', 'user')
            .leftJoinAndSelect('user.profile', 'profile')
            .leftJoinAndSelect('order.plan', 'plan')
            .orderBy('order.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);

        if (status) query.andWhere('order.status = :status', { status });
        if (userId) query.andWhere('user.id = :userId', { userId });
        if (planId) query.andWhere('plan.id = :planId', { planId });

        if (search) {
            query.andWhere(
                '(user.email ILike :search OR user.username ILike :search OR profile.fullName ILike :search)',
                { search: `%${search}%` }
            );
        }

        if (startDate && endDate) {
            query.andWhere('order.createdAt BETWEEN :startDate AND :endDate', { 
                startDate: new Date(startDate), 
                endDate: new Date(endDate) 
            });
        }

        const [items, total] = await query.getManyAndCount();
        return {
            items,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Get all users with pagination and filters
     */
    async getAllUsers(filters: AdminUserFilterDto) {
        const { page = 1, limit = 20, role, status, search, startDate, endDate } = filters;
        const query = this.userRepo.createQueryBuilder('user')
            .leftJoinAndSelect('user.profile', 'profile')
            .leftJoinAndSelect('user.influencerProfile', 'influencer')
            .orderBy('user.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);

        if (role) query.andWhere('user.role = :role', { role });
        if (status) query.andWhere('user.status = :status', { status });
        if (search) {
            query.andWhere(
                '(user.email ILike :search OR user.username ILike :search OR profile.fullName ILike :search)',
                { search: `%${search}%` }
            );
        }
        if (startDate && endDate) {
            query.andWhere('user.createdAt BETWEEN :startDate AND :endDate', { 
                startDate: new Date(startDate), 
                endDate: new Date(endDate) 
            });
        }

        const [items, total] = await query.getManyAndCount();
        return {
            items,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Update user status (Ban/Unban)
     */
    async updateUserStatus(userId: string, status: UserStatus) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) throw new Error('User not found');
        user.status = status;
        return await this.userRepo.save(user);
    }

    /**
     * Bulk update user status
     */
    async bulkUpdateUserStatus(dto: AdminBulkStatusDto) {
        return await this.userRepo.update(dto.userIds, { status: dto.status });
    }

    /**
     * Manually update influencer verification status
     */
    async verifyInfluencer(influencerId: string, verified: boolean) {
        const influencer = await this.userRepo.findOne({ 
            where: { id: influencerId },
            relations: ['influencerProfile'] 
        });
        if (!influencer || !influencer.influencerProfile) {
            throw new Error('Influencer profile not found');
        }
        
        // This is a simplified "Direct Verification" as requested
        // In a real scenario, we might also update the latest VerificationRequest if one exists
        // But for "God Mode" we update the profile directly
        return await this.userRepo.query(`
            UPDATE influencer_profiles 
            SET "verified" = $1 
            WHERE id = $2
        `, [verified, influencer.influencerProfile.id]);
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
