import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsArray, IsEnum, IsObject } from 'class-validator';
import { AvailabilityStatus } from '../../../database/entities/enums';

export class SaveInfluencerProfileDto {
    @ApiPropertyOptional({ example: 'Lifestyle' })
    @IsOptional()
    @IsString()
    niche?: string;

    @ApiPropertyOptional({
        example: { instagram: { handle: '@johndoe', followers: 10000 } },
    })
    @IsOptional()
    @IsObject()
    platforms?: any;

    @ApiPropertyOptional({ example: 10000 })
    @IsOptional()
    @IsNumber()
    followersCount?: number;

    @ApiPropertyOptional({ example: 4.5 })
    @IsOptional()
    @IsNumber()
    engagementRate?: number;

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
