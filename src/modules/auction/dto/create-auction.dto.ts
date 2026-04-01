import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsDateString, IsEnum } from 'class-validator';
import { CollaborationType } from '../../../database/entities/enums';

export class CreateAuctionDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    description: string;

    @ApiProperty({ required: false })
    @IsNumber()
    @IsOptional()
    minBudget?: number;

    @ApiProperty({ required: false })
    @IsNumber()
    @IsOptional()
    maxBudget?: number;

    @ApiProperty()
    @IsDateString()
    @IsNotEmpty()
    deadline: string;

    @ApiProperty({ enum: CollaborationType, required: false })
    @IsEnum(CollaborationType)
    @IsOptional()
    category?: CollaborationType;
}
