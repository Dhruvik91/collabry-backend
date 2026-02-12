import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateRankingWeightsDto {
    @ApiProperty({
        description: 'Weight for completed collaborations',
        example: 10,
        required: false,
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    completedCollaborations?: number;

    @ApiProperty({
        description: 'Weight for paid promotions',
        example: 15,
        required: false,
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    paidPromotions?: number;

    @ApiProperty({
        description: 'Multiplier for average rating',
        example: 50,
        required: false,
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(200)
    averageRating?: number;

    @ApiProperty({
        description: 'Weight for response speed',
        example: 20,
        required: false,
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    responseSpeed?: number;

    @ApiProperty({
        description: 'Multiplier for completion rate',
        example: 30,
        required: false,
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    completionRate?: number;

    @ApiProperty({
        description: 'Flat bonus for verified influencers',
        example: 100,
        required: false,
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(500)
    verificationBonus?: number;

    @ApiProperty({
        description: 'Penalty per cancelled collaboration',
        example: -50,
        required: false,
    })
    @IsOptional()
    @IsNumber()
    @Max(0)
    @Min(-200)
    cancellationPenalty?: number;

    @ApiProperty({
        description: 'Penalty per rejected collaboration',
        example: -30,
        required: false,
    })
    @IsOptional()
    @IsNumber()
    @Max(0)
    @Min(-200)
    rejectionPenalty?: number;

    @ApiProperty({
        description: 'Penalty for low rating (below 3.0)',
        example: -50,
        required: false,
    })
    @IsOptional()
    @IsNumber()
    @Max(0)
    @Min(-200)
    lowRatingPenalty?: number;
}
