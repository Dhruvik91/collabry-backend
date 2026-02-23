import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, Max, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class SearchInfluencersDto {
    @ApiPropertyOptional({ example: 'Lifestyle' })
    @IsOptional()
    @IsString()
    niche?: string;

    @ApiPropertyOptional({ example: 'fitness' })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ example: 'Instagram' })
    @IsOptional()
    @IsString()
    platform?: string;

    @ApiPropertyOptional({ example: 1000 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    minFollowers?: number;

    @ApiPropertyOptional({ example: 'Rising Creator', description: 'Filter by ranking tier' })
    @IsOptional()
    @IsString()
    rankingTier?: string;

    @ApiPropertyOptional({ example: 3.5, description: 'Minimum average rating' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    @Max(5)
    minRating?: number;

    @ApiPropertyOptional({ example: 5, description: 'Maximum average rating' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    @Max(5)
    maxRating?: number;

    @ApiPropertyOptional({ example: true, description: 'Filter verified influencers only' })
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    verified?: boolean;

    @ApiPropertyOptional({ example: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ example: 10 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @Max(100)
    limit?: number = 10;
}
