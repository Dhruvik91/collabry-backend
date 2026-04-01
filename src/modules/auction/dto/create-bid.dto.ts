import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateBidDto {
    @ApiProperty()
    @IsNumber()
    @IsNotEmpty()
    @Min(0)
    amount: number;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    proposal: string;
}
