import { ApiProperty } from '@nestjs/swagger';

export class RankingBreakdownDto {
    @ApiProperty({
        description: 'Completed collaborations contribution',
        example: { count: 45, score: 20, maxScore: 25 },
    })
    completedCollaborations: {
        count: number;
        score: number;
        maxScore: number;
    };

    @ApiProperty({
        description: 'Paid promotions contribution',
        example: { count: 20, score: 12, maxScore: 15 },
    })
    paidPromotions: {
        count: number;
        score: number;
        maxScore: number;
    };

    @ApiProperty({
        description: 'Average rating contribution',
        example: { value: 4.8, score: 24, maxScore: 25 },
    })
    averageRating: {
        value: number;
        score: number;
        maxScore: number;
    };

    @ApiProperty({
        description: 'Response speed contribution',
        example: { hours: 2.5, score: 10, maxScore: 10 },
    })
    responseSpeed: {
        hours: number;
        score: number;
        maxScore: number;
    };

    @ApiProperty({
        description: 'Completion rate contribution',
        example: { percentage: 93.3, score: 18, maxScore: 20 },
    })
    completionRate: {
        percentage: number;
        score: number;
        maxScore: number;
    };

    @ApiProperty({
        description: 'Verification bonus',
        example: { isVerified: true, score: 5, maxScore: 5 },
    })
    verificationBonus: {
        isVerified: boolean;
        score: number;
        maxScore: number;
    };

    @ApiProperty({
        description: 'Penalties applied',
        example: { count: 2, score: -50, breakdown: { cancellations: 1, rejections: 1, reports: 0 } },
    })
    penalties: {
        count: number;
        score: number;
        breakdown: {
            cancellations: number;
            rejections: number;
            reports: number;
        };
    };

    @ApiProperty({
        description: 'Total ranking score',
        example: 89,
    })
    totalScore: number;

    @ApiProperty({
        description: 'Current ranking tier',
        example: 'Pro Influencer',
    })
    rankingTier: string;

    @ApiProperty({
        description: 'Next tier to achieve',
        example: 'Elite Creator',
        nullable: true,
    })
    nextTier: string | null;

    @ApiProperty({
        description: 'Progress towards next tier (0-100)',
        example: 75,
    })
    tierProgress: number;

    @ApiProperty({
        description: 'Status of specific tier requirements',
        example: { score: true, completedCollabs: true, rating: true, completion: true, responseTime: true, verified: true, penalties: true },
    })
    requirementsMet: Record<string, boolean>;

    @ApiProperty({
        description: 'Current tier requirements',
        example: { minScore: 65, minCollabs: 25, minRating: 4.3, minCompletion: 90, maxResponseHours: 24, verified: true, maxPenalties: 5 },
    })
    tierRequirements: Record<string, any>;
}
