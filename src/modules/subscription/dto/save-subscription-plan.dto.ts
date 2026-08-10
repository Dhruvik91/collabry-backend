import { ApiProperty } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsBoolean,
} from "class-validator";
import { SubscriptionTier } from "../../../database/entities/enums";

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

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isPopular?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  razorpayPlanId?: string;

  @ApiProperty({ required: false, default: "monthly" })
  @IsOptional()
  @IsString()
  billingPeriod?: string;
}
