import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class UpdateSettingDto {
    @ApiProperty({ example: 300, description: 'New value for the setting' })
    @IsNumber()
    @Min(0)
    value: number;
}
