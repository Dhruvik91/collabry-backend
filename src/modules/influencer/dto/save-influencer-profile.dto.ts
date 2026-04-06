import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsArray, IsEnum, IsObject } from 'class-validator';
import { AvailabilityStatus } from '../../../database/entities/enums';

export class SaveInfluencerProfileDto {
    @ApiPropertyOptional({ example: 'John Doe' })
    @IsOptional()
    @IsString()
    fullName?: string;

    @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
    @IsOptional()
    @IsString()
    avatarUrl?: string;

    @ApiPropertyOptional({ example: 'Passionate content creator focused on lifestyle and wellness' })
    @IsOptional()
    @IsString()
    bio?: string;

    @ApiPropertyOptional({ example: 'San Francisco, CA' })
    @IsOptional()
    @IsString()
    address?: string;

    @ApiPropertyOptional({
        example: { instagram: { handle: '@johndoe', followers: 10000, engagementRate: 4.5 } },
    })
    @IsOptional()
    @IsObject()
    platforms?: any;

    @ApiPropertyOptional({ example: ['Paid Shoutout', 'Affiliate'] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    collaborationTypes?: string[];

    @ApiPropertyOptional({ enum: AvailabilityStatus, example: AvailabilityStatus.OPEN })
    @IsOptional()
    @IsEnum(AvailabilityStatus)
    availability?: AvailabilityStatus;

    @ApiPropertyOptional({ example: ['Fitness', 'Health'] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    categories?: string[];

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

    @ApiPropertyOptional({ example: ['English', 'Spanish'] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    languages?: string[];

    @ApiPropertyOptional({ example: { male: 0.3, female: 0.7 } })
    @IsOptional()
    @IsObject()
    audienceGenderRatio?: any;

    @ApiPropertyOptional({ example: { '18-24': 0.4, '25-34': 0.6 } })
    @IsOptional()
    @IsObject()
    audienceAgeBrackets?: any;

    @ApiPropertyOptional({ example: ['US', 'CA', 'UK'] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    audienceTopCountries?: string[];

    @ApiPropertyOptional({ example: 100 })
    @IsOptional()
    @IsNumber()
    minPrice?: number;

    @ApiPropertyOptional({ example: 500 })
    @IsOptional()
    @IsNumber()
    maxPrice?: number;
}
