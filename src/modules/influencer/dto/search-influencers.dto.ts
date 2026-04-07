import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, Max, IsBoolean, IsArray } from 'class-validator';
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

    @ApiPropertyOptional({ example: ['Fitness', 'Health'], type: [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    categories?: string[];

    @ApiPropertyOptional({ example: 10000 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    maxFollowers?: number;

    @ApiPropertyOptional({ example: 2.5 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    minEngagementRate?: number;

    @ApiPropertyOptional({ example: 'United States' })
    @IsOptional()
    @IsString()
    locationCountry?: string;

    @ApiPropertyOptional({ example: 'New York' })
    @IsOptional()
    @IsString()
    locationCity?: string;

    @ApiPropertyOptional({ example: 'Female' })
    @IsOptional()
    @IsString()
    gender?: string;

    @ApiPropertyOptional({ example: ['English'] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    languages?: string[];

    @ApiPropertyOptional({ example: 100 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    priceMin?: number;

    @ApiPropertyOptional({ example: 1000 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    priceMax?: number;

    @ApiPropertyOptional({ example: 'Female' })
    @IsOptional()
    @IsString()
    audienceGender?: string;

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
