import { IsEmail, IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignupDto {
    @ApiProperty({ example: 'user@example.com', description: 'Email address' })
    @IsEmail({}, { message: 'Please provide a valid email address' })
    email: string;

    @ApiProperty({ example: 'password123', description: 'Password (minimum 6 characters)', minLength: 6 })
    @IsString()
    @MinLength(6, { message: 'Password must be at least 6 characters long' })
    password: string;

    @ApiProperty({ example: 'password123', description: 'Confirm password' })
    @IsString()
    @MinLength(6, { message: 'Confirm password must be at least 6 characters long' })
    confirmPassword: string;
}

export class LoginDto {
    @ApiProperty({ example: 'user@example.com', description: 'Email address' })
    @IsEmail({}, { message: 'Please provide a valid email address' })
    email: string;

    @ApiProperty({ example: 'password123', description: 'Password' })
    @IsString()
    @MinLength(6, { message: 'Password must be at least 6 characters long' })
    password: string;
}

export class CreateInfluencerDto {
    @ApiProperty({ example: 'influencer@example.com', description: 'Influencer email address' })
    @IsEmail({}, { message: 'Please provide a valid email address' })
    email: string;

    @ApiProperty({ example: 'password123', description: 'Password (minimum 6 characters)', minLength: 6 })
    @IsString()
    @MinLength(6, { message: 'Password must be at least 6 characters long' })
    password: string;

    @ApiProperty({ example: 'password123', description: 'Confirm password' })
    @IsString()
    @MinLength(6, { message: 'Confirm password must be at least 6 characters long' })
    confirmPassword: string;
}
