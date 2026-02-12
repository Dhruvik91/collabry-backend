import { IsString, IsOptional, IsDateString, IsObject, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCollaborationDto {
    @ApiPropertyOptional({ example: 'Updated Campaign Title' })
    @IsString()
    @IsOptional()
    @MinLength(5)
    title?: string;

    @ApiPropertyOptional({ example: 'Updated description of the campaign...' })
    @IsString()
    @IsOptional()
    @MinLength(20)
    description?: string;

    @ApiPropertyOptional()
    @IsObject()
    @IsOptional()
    proposedTerms?: any;

    @ApiPropertyOptional({ example: '2024-06-01T00:00:00Z' })
    @IsDateString()
    @IsOptional()
    startDate?: string;

    @ApiPropertyOptional({ example: '2024-06-30T00:00:00Z' })
    @IsDateString()
    @IsOptional()
    endDate?: string;

    @ApiPropertyOptional({ type: [String] })
    @IsString({ each: true })
    @IsOptional()
    proofUrls?: string[];

    @ApiPropertyOptional()
    @IsDateString()
    @IsOptional()
    proofSubmittedAt?: string;
}
