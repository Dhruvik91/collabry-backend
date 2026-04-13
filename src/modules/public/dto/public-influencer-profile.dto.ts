import { ApiProperty } from '@nestjs/swagger';

export class PublicInfluencerProfileDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    fullName: string;

    @ApiProperty()
    avatarUrl: string;

    @ApiProperty()
    bio: string;

    @ApiProperty()
    platforms: any;

    @ApiProperty()
    categories: string[];

    @ApiProperty()
    locationCountry: string;

    @ApiProperty()
    locationCity: string;

    @ApiProperty()
    totalFollowers: number;

    @ApiProperty()
    avgEngagementRate: number;

    @ApiProperty()
    rankingTier: string;

    @ApiProperty()
    verified: boolean;

    @ApiProperty()
    username: string;

    @ApiProperty()
    reviews: any[];

    @ApiProperty()
    ranking: any;

    @ApiProperty()
    activeCollaborations: any[];

    @ApiProperty()
    completedCollaborations: any[];

    @ApiProperty()
    avgRating: number;

    @ApiProperty()
    totalReviews: number;

    @ApiProperty()
    completedCollabCount: number;

    @ApiProperty()
    address: string;

    @ApiProperty()
    gender: string;

    @ApiProperty()
    languages: string[];

    @ApiProperty()
    audienceGenderRatio: any;

    @ApiProperty()
    audienceAgeBrackets: any;

    @ApiProperty()
    audienceTopCountries: string[];

    @ApiProperty()
    minPrice: number;

    @ApiProperty()
    maxPrice: number;
}
