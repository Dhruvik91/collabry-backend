import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
    @ApiProperty({ example: 'OldPassword123!' })
    @IsNotEmpty()
    @IsString()
    currentPassword: string;

    @ApiProperty({ example: 'NewPassword123!' })
    @IsNotEmpty()
    @IsString()
    @MinLength(6, { message: 'New password must be at least 6 characters long' })
    newPassword: string;
}
