import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SendMessageDto {
    @ApiProperty({ example: 'Hello, I interested in your profile for a collaboration!' })
    @IsNotEmpty()
    @IsString()
    message: string;
}
