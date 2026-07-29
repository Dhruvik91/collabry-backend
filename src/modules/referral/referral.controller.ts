import { Controller, Get, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import {
  ApiOkResponseEnvelope,
  ApiUnauthorizedResponseEnvelope,
} from "../../core/swagger/response-envelope";
import { ReferralService } from "./referral.service";
import {
  ReferralStatsDto,
  ReferralConfigDto,
} from "./dto/referral-response.dto";
import { JwtAuthGuard } from "../auth/Guards/jwt-guard";
import { RolesGuard } from "../auth/Guards/roles.guard";

@ApiTags("Referrals")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("v1/referrals")
export class ReferralController {
  constructor(private readonly referralService: ReferralService) {}

  @Get("stats")
  @ApiOperation({ summary: "Get my referral statistics" })
  @ApiOkResponseEnvelope(ReferralStatsDto)
  @ApiUnauthorizedResponseEnvelope()
  async getMyStats(@Req() req: any) {
    return await this.referralService.getReferralStats(req.user.id);
  }

  @Get("config")
  @ApiOperation({ summary: "Get referral configuration" })
  @ApiOkResponseEnvelope(ReferralConfigDto)
  async getConfig() {
    return await this.referralService.getReferralConfig();
  }
}
