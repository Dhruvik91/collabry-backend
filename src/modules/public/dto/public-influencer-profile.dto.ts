import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class PublicBrandPartnerDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    fullName: string;

    @ApiPropertyOptional()
    avatarUrl?: string;

    @ApiPropertyOptional()
    username?: string;
}

export class PublicInfluencerProfileDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    fullName: string;

    @ApiPropertyOptional()
    avatarUrl?: string;

    @ApiPropertyOptional()
    bio?: string;

    @ApiPropertyOptional()
    platforms?: Record<string, any>;

    @ApiPropertyOptional()
    categories?: string[];

    @ApiPropertyOptional()
    locationCountry?: string;

    @ApiPropertyOptional()
    locationCity?: string;

    @ApiProperty()
    totalFollowers: number;

    @ApiProperty()
    avgEngagementRate: number;

    @ApiPropertyOptional()
    rankingTier?: string;

    @ApiProperty()
    verified: boolean;

    @ApiProperty()
    username: string;

    @ApiProperty({ type: [Object] })
    reviews: any[];

    @ApiPropertyOptional()
    ranking?: any;

    @ApiProperty({ type: [PublicBrandPartnerDto] })
    brandPartners: PublicBrandPartnerDto[];

    @ApiProperty()
    brandPartnerCount: number;

    @ApiProperty()
    avgRating: number;

    @ApiProperty()
    totalReviews: number;

    @ApiProperty()
    completedCollabCount: number;

    @ApiPropertyOptional()
    languages?: string[];

    @ApiPropertyOptional()
    audienceGenderRatio?: any;

    @ApiPropertyOptional()
    audienceAgeBrackets?: any;

    @ApiPropertyOptional()
    audienceTopCountries?: string[];

    @ApiPropertyOptional()
    minPrice?: number;

    @ApiPropertyOptional()
    maxPrice?: number;
}
