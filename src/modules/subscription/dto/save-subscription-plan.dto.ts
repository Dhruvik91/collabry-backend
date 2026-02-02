import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEnum, IsNumber, IsOptional, IsJSON } from 'class-validator';
import { SubscriptionTier } from '../../../database/entities/enums';

export class SaveSubscriptionPlanDto {
    @ApiProperty({ enum: SubscriptionTier, example: SubscriptionTier.PRO })
    @IsNotEmpty()
    @IsEnum(SubscriptionTier)
    name: SubscriptionTier;

    @ApiProperty({ example: 29.99 })
    @IsNotEmpty()
    @IsNumber()
    price: number;

    @ApiProperty({ example: { collaborators: 10, searchFilters: true } })
    @IsOptional()
    features?: any;
}
