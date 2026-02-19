import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsArray, IsEnum, IsObject } from 'class-validator';
import { AvailabilityStatus } from '../../../database/entities/enums';

export class SaveInfluencerProfileDto {
    @ApiPropertyOptional({ example: 'John Doe' })
    @IsOptional()
    @IsString()
    fullName?: string;

    @ApiPropertyOptional({ example: 'Lifestyle' })
    @IsOptional()
    @IsString()
    niche?: string;

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
}
