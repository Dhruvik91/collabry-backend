import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID, IsNumber, Min, Max, IsString, IsOptional } from 'class-validator';

export class CreateReviewDto {
    @ApiPropertyOptional({ example: 'uuid-of-collaboration' })
    @IsOptional()
    @IsUUID()
    collaborationId?: string;

    @ApiProperty({ example: 'uuid-of-influencer' })
    @IsNotEmpty()
    @IsUUID()
    influencerId: string;

    @ApiProperty({ example: 5, description: 'Rating from 1 to 5' })
    @IsNotEmpty()
    @IsNumber()
    @Min(1)
    @Max(5)
    rating: number;

    @ApiPropertyOptional({ example: 'Great influencer! Very professional and delivered on time.' })
    @IsOptional()
    @IsString()
    comment?: string;
}
