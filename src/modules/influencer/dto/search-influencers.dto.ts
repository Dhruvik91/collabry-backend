import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

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
