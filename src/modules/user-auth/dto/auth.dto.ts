import { IsEmail, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../../database/entities/enums';

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

    @ApiProperty({ enum: UserRole, example: UserRole.USER, description: 'User role' })
    @IsEnum(UserRole, { message: 'Invalid role' })
    @IsOptional()
    role?: UserRole;

    @ApiProperty({ example: 'johndoe', description: 'Unique username' })
    @IsString()
    @IsOptional()
    username?: string;

    @ApiProperty({ example: 'ABC12345', description: 'Referral code', required: false })
    @IsString()
    @IsOptional()
    referralCode?: string;
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

    @ApiProperty({ example: 'johndoe', description: 'Unique username' })
    @IsString()
    @IsOptional()
    username?: string;

    @ApiProperty({ example: 'ABC12345', description: 'Referral code', required: false })
    @IsString()
    @IsOptional()
    referralCode?: string;
}

export class FirebaseLoginDto {
    @ApiProperty({ example: 'firebase_id_token_here', description: 'Firebase client ID Token' })
    @IsString()
    idToken: string;

    @ApiProperty({ enum: UserRole, example: UserRole.USER, description: 'User role', required: false })
    @IsEnum(UserRole, { message: 'Invalid role' })
    @IsOptional()
    role?: UserRole;

    @ApiProperty({ example: 'ABC12345', description: 'Referral code', required: false })
    @IsString()
    @IsOptional()
    referralCode?: string;
}
