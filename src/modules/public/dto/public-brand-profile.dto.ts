import { ApiProperty } from '@nestjs/swagger';

export class PublicBrandProfileDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    fullName: string;

    @ApiProperty()
    username: string;

    @ApiProperty()
    avatarUrl: string;

    @ApiProperty()
    bio: string;

    @ApiProperty()
    location: string;

    @ApiProperty()
    socialLinks: any;

    @ApiProperty()
    auctionsDone: any[];

    @ApiProperty()
    collaborationsDone: any[];
}
