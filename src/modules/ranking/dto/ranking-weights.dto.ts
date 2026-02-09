import { ApiProperty } from '@nestjs/swagger';

export class RankingWeightsDto {
    @ApiProperty({
        description: 'Weight for completed collaborations',
        example: 10,
    })
    completedCollaborations: number;

    @ApiProperty({
        description: 'Weight for paid promotions',
        example: 15,
    })
    paidPromotions: number;

    @ApiProperty({
        description: 'Multiplier for average rating',
        example: 50,
    })
    averageRating: number;

    @ApiProperty({
        description: 'Weight for response speed',
        example: 20,
    })
    responseSpeed: number;

    @ApiProperty({
        description: 'Multiplier for completion rate',
        example: 30,
    })
    completionRate: number;

    @ApiProperty({
        description: 'Flat bonus for verified influencers',
        example: 100,
    })
    verificationBonus: number;

    @ApiProperty({
        description: 'Penalty per cancelled collaboration',
        example: -50,
    })
    cancellationPenalty: number;

    @ApiProperty({
        description: 'Penalty per rejected collaboration',
        example: -30,
    })
    rejectionPenalty: number;

    @ApiProperty({
        description: 'Penalty for low rating (below 3.0)',
        example: -50,
    })
    lowRatingPenalty: number;
}
