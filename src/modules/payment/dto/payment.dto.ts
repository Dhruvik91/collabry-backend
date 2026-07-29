import { IsString, IsNotEmpty, IsUUID, MaxLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class InitiateTopUpDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  planId: string;
}

export class VerifyPaymentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  razorpayOrderId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  razorpayPaymentId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  razorpaySignature: string;
}
