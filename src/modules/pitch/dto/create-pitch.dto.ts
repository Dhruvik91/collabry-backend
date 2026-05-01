import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreatePitchDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsUUID()
    targetId: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    message: string;
}
