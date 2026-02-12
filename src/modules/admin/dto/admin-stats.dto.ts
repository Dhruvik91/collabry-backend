import { ApiProperty } from '@nestjs/swagger';

export class UserStatsDto {
    @ApiProperty({ description: 'Total number of users', example: 1250 })
    totalUsers: number;

    @ApiProperty({ description: 'Number of regular users', example: 800 })
    regularUsers: number;

    @ApiProperty({ description: 'Number of influencers', example: 400 })
    influencers: number;

    @ApiProperty({ description: 'Number of admins', example: 5 })
    admins: number;

    @ApiProperty({ description: 'New users this week', example: 45 })
    newUsersThisWeek: number;

    @ApiProperty({ description: 'New users this month', example: 180 })
    newUsersThisMonth: number;
}

export class CollaborationStatsDto {
    @ApiProperty({ description: 'Total collaborations', example: 3500 })
    totalCollaborations: number;

    @ApiProperty({ description: 'Active collaborations', example: 120 })
    activeCollaborations: number;

    @ApiProperty({ description: 'Completed collaborations', example: 2800 })
    completedCollaborations: number;

    @ApiProperty({ description: 'Pending requests', example: 85 })
    pendingRequests: number;

    @ApiProperty({ description: 'Cancelled collaborations', example: 150 })
    cancelledCollaborations: number;

    @ApiProperty({ description: 'Average completion rate (%)', example: 85.5 })
    completionRate: number;
}

export class VerificationStatsDto {
    @ApiProperty({ description: 'Total verification requests', example: 450 })
    totalRequests: number;

    @ApiProperty({ description: 'Pending verification requests', example: 25 })
    pendingRequests: number;

    @ApiProperty({ description: 'Approved requests', example: 380 })
    approvedRequests: number;

    @ApiProperty({ description: 'Rejected requests', example: 45 })
    rejectedRequests: number;

    @ApiProperty({ description: 'Approval rate (%)', example: 89.4 })
    approvalRate: number;
}

export class ReviewStatsDto {
    @ApiProperty({ description: 'Total reviews', example: 2100 })
    totalReviews: number;

    @ApiProperty({ description: 'Average rating', example: 4.3 })
    averageRating: number;

    @ApiProperty({ description: 'Reviews this week', example: 45 })
    reviewsThisWeek: number;

    @ApiProperty({ description: 'Reviews this month', example: 180 })
    reviewsThisMonth: number;
}

export class PlatformGrowthDto {
    @ApiProperty({ description: 'Week label', example: 'Week 1' })
    week: string;

    @ApiProperty({ description: 'New users', example: 45 })
    newUsers: number;

    @ApiProperty({ description: 'New collaborations', example: 120 })
    newCollaborations: number;

    @ApiProperty({ description: 'New reviews', example: 35 })
    newReviews: number;
}

export class AdminStatsDto {
    @ApiProperty({ description: 'User statistics', type: UserStatsDto })
    users: UserStatsDto;

    @ApiProperty({ description: 'Collaboration statistics', type: CollaborationStatsDto })
    collaborations: CollaborationStatsDto;

    @ApiProperty({ description: 'Verification statistics', type: VerificationStatsDto })
    verifications: VerificationStatsDto;

    @ApiProperty({ description: 'Review statistics', type: ReviewStatsDto })
    reviews: ReviewStatsDto;

    @ApiProperty({ description: 'Platform growth data (last 8 weeks)', type: [PlatformGrowthDto] })
    growth: PlatformGrowthDto[];
}
