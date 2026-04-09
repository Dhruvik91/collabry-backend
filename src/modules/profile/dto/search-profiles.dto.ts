import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole } from '../../../database/entities/enums';

export class SearchProfilesDto {
    @ApiPropertyOptional({ example: 'John' })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional({ example: 'johndoe' })
    @IsOptional()
    @IsString()
    username?: string;

    @ApiPropertyOptional({ example: 'New York' })
    @IsOptional()
    @IsString()
    location?: string;

    @ApiPropertyOptional({ enum: UserRole })
    @IsOptional()
    @IsString()
    role?: UserRole;

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
