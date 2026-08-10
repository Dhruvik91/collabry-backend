import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsUUID } from "class-validator";

export class InitiateSubscriptionDto {
  @ApiProperty({ example: "e34b7f80-0a25-4a6c-9c7d-e6b7c53d9e80" })
  @IsNotEmpty()
  @IsUUID()
  planId: string;
}

export class VerifySubscriptionDto {
  @ApiProperty({ example: "pay_XYZ123" })
  @IsNotEmpty()
  @IsString()
  razorpayPaymentId: string;

  @ApiProperty({ example: "sub_ABC456" })
  @IsNotEmpty()
  @IsString()
  razorpaySubscriptionId: string;

  @ApiProperty({ example: "signature_789" })
  @IsNotEmpty()
  @IsString()
  razorpaySignature: string;
}
