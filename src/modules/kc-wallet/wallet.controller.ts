import { Controller, Get, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import {
  ApiOkResponseEnvelope,
  ApiUnauthorizedResponseEnvelope,
} from "../../core/swagger/response-envelope";
import { WalletService } from "./wallet.service";
import { JwtAuthGuard } from "../auth/Guards/jwt-guard";
import { RolesGuard } from "../auth/Guards/roles.guard";
import { Wallet } from "../../database/entities/wallet.entity";

@ApiTags("KC Coins")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("v1/kc-wallet")
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get("my")
  @ApiOperation({ summary: "Get my KC coin wallet balance" })
  @ApiOkResponseEnvelope(Wallet)
  @ApiUnauthorizedResponseEnvelope()
  async getMyWallet(@Req() req: any) {
    return await this.walletService.getWallet(req.user.id);
  }
}
