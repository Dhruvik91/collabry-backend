import { ApiProperty } from "@nestjs/swagger";

export class ReferralStatsDto {
  @ApiProperty()
  totalReferrals: number;

  @ApiProperty()
  totalEarnings: number;

  @ApiProperty()
  referralCode: string;
}

export class ReferralConfigDto {
  @ApiProperty()
  rewardAmount: number;

  @ApiProperty()
  currency: string;
}
