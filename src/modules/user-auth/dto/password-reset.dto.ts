import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email address of the user' })
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Password reset token received via email' })
  @IsString()
  token: string;

  @ApiProperty({ description: 'New password (minimum 6 characters)', minLength: 6 })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
