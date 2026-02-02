import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, IsObject } from 'class-validator';

export class UpdateProfileDto {
    @ApiPropertyOptional({ example: 'John Doe' })
    @IsOptional()
    @IsString()
    fullName?: string;

    @ApiPropertyOptional({ example: 'johndoe' })
    @IsOptional()
    @IsString()
    username?: string;

    @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
    @IsOptional()
    @IsUrl()
    avatarUrl?: string;

    @ApiPropertyOptional({ example: 'Blogger and travel enthusiast' })
    @IsOptional()
    @IsString()
    bio?: string;

    @ApiPropertyOptional({ example: 'New York, USA' })
    @IsOptional()
    @IsString()
    location?: string;

    @ApiPropertyOptional({
        example: { twitter: 'https://twitter.com/johndoe', instagram: 'https://instagram.com/johndoe' },
    })
    @IsOptional()
    @IsObject()
    socialLinks?: any;
}
