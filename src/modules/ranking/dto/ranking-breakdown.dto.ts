import { ApiProperty } from '@nestjs/swagger';

export class RankingBreakdownDto {
    @ApiProperty({
        description: 'Completed collaborations contribution',
        example: { count: 45, score: 450 },
    })
    completedCollaborations: {
        count: number;
        score: number;
    };

    @ApiProperty({
        description: 'Paid promotions contribution',
        example: { count: 20, score: 300 },
    })
    paidPromotions: {
        count: number;
        score: number;
    };

    @ApiProperty({
        description: 'Average rating contribution',
        example: { value: 4.8, score: 240 },
    })
    averageRating: {
        value: number;
        score: number;
    };

    @ApiProperty({
        description: 'Response speed contribution',
        example: { hours: 2.5, score: 95 },
    })
    responseSpeed: {
        hours: number;
        score: number;
    };

    @ApiProperty({
        description: 'Completion rate contribution',
        example: { percentage: 93.3, score: 28 },
    })
    completionRate: {
        percentage: number;
        score: number;
    };

    @ApiProperty({
        description: 'Verification bonus',
        example: { isVerified: true, score: 100 },
    })
    verificationBonus: {
        isVerified: boolean;
        score: number;
    };

    @ApiProperty({
        description: 'Penalties applied',
        example: { count: 2, score: -100 },
    })
    penalties: {
        count: number;
        score: number;
    };

    @ApiProperty({
        description: 'Total ranking score',
        example: 1113,
    })
    totalScore: number;

    @ApiProperty({
        description: 'Current ranking tier',
        example: 'Pro Influencer',
    })
    rankingTier: string;

    @ApiProperty({
        description: 'Status of specific tier requirements',
        example: { completedCollabs: true, averageRating: true, zeroFraud: true },
    })
    requirementsMet: Record<string, boolean>;
}
