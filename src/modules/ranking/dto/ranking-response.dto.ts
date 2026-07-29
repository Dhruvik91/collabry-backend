import { ApiProperty } from "@nestjs/swagger";

export class RecalculateRankingResponseDto {
  @ApiProperty({ example: "Ranking recalculated successfully" })
  message: string;

  @ApiProperty({ example: "uuid" })
  influencerId: string;

  @ApiProperty({ example: 85.5 })
  newScore: number;
}

export class RecalculateAllRankingsResponseDto {
  @ApiProperty({ example: "Ranking recalculation started for all influencers" })
  message: string;

  @ApiProperty({ example: "processing" })
  status: string;
}

export class TierGuideDto {
  @ApiProperty()
  tiers: any[];

  @ApiProperty()
  scoringGuide: any;
}
