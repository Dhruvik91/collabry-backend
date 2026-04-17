import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class PublicBrandStatsDto {
    @ApiProperty()
    totalAuctions: number;

    @ApiProperty()
    activeAuctionsCount: number;

    @ApiProperty()
    completedCollaborations: number;
}

class PublicCollaboratorSummaryDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    fullName: string;

    @ApiPropertyOptional()
    avatarUrl?: string;

    @ApiPropertyOptional()
    username?: string;
}

export class PublicBrandProfileDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    fullName: string;

    @ApiProperty()
    username: string;

    @ApiPropertyOptional()
    avatarUrl?: string;

    @ApiPropertyOptional()
    bio?: string;

    @ApiPropertyOptional()
    location?: string;

    @ApiPropertyOptional()
    socialLinks?: Record<string, string>;

    @ApiProperty({ type: PublicBrandStatsDto })
    stats: PublicBrandStatsDto;

    @ApiProperty()
    collaboratorCount: number;

    @ApiProperty({ type: [PublicCollaboratorSummaryDto] })
    collaborators: PublicCollaboratorSummaryDto[];
}
