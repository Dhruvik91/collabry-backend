import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID, IsNumber, Min, Max, IsString, IsOptional } from 'class-validator';

export class CreateReviewDto {
    @ApiProperty({ example: 'uuid-of-collaboration' })
    @IsNotEmpty()
    @IsUUID()
    collaborationId: string;

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
