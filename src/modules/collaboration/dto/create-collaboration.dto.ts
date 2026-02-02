import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID, IsString, IsOptional, IsObject, IsDateString } from 'class-validator';

export class CreateCollaborationDto {
    @ApiProperty({ example: 'uuid-of-influencer' })
    @IsNotEmpty()
    @IsUUID()
    influencerId: string;

    @ApiProperty({ example: 'Summer Campaign 2024' })
    @IsNotEmpty()
    @IsString()
    title: string;

    @ApiPropertyOptional({ example: 'Promotion of our new eco-friendly products' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({
        example: { platforms: ['Instagram', 'TikTok'], deliverables: '2 posts, 3 stories' },
    })
    @IsOptional()
    @IsObject()
    proposedTerms?: any;

    @ApiPropertyOptional({ example: '2024-06-01' })
    @IsOptional()
    @IsDateString()
    startDate?: Date;

    @ApiPropertyOptional({ example: '2024-06-30' })
    @IsOptional()
    @IsDateString()
    endDate?: Date;
}
