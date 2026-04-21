import { IsString, IsNumber, IsBoolean, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTopUpPlanDto {
    @ApiProperty()
    @IsString()
    name: string;

    @ApiProperty()
    @IsNumber()
    @Min(1)
    amount: number;

    @ApiProperty()
    @IsNumber()
    @Min(1)
    coins: number;

    @ApiProperty()
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

export class UpdateTopUpPlanDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    @Min(1)
    amount?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    @Min(1)
    coins?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
