import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, IsObject } from 'class-validator';

export class SaveProfileDto {
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

    @ApiPropertyOptional({ example: ['Fashion', 'Tech'] })
    @IsOptional()
    @IsString({ each: true })
    categories?: string[];

    @ApiPropertyOptional({ example: 'https://kollabary.com' })
    @IsOptional()
    @IsUrl()
    website?: string;

    @ApiPropertyOptional({ example: 'E-commerce' })
    @IsOptional()
    @IsString()
    industry?: string;

    @ApiPropertyOptional({ example: '11-50' })
    @IsOptional()
    @IsString()
    companySize?: string;

    @ApiPropertyOptional({ example: 'Friendly and professional' })
    @IsOptional()
    @IsString()
    brandTone?: string;

    @ApiPropertyOptional({ example: 'contact@brand.com' })
    @IsOptional()
    @IsString()
    contactEmail?: string;

    @ApiPropertyOptional({ example: '+1234567890' })
    @IsOptional()
    @IsString()
    contactPhone?: string;
}
