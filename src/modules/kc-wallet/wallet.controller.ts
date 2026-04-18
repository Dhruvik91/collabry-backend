import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/Guards/jwt-guard';
import { RolesGuard } from '../auth/Guards/roles.guard';

@ApiTags('KC Coins')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('v1/kc-wallet')
export class WalletController {
    constructor(private readonly walletService: WalletService) { }

    @Get('my')
    @ApiOperation({ summary: 'Get my KC coin wallet balance' })
    async getMyWallet(@Req() req: any) {
        return await this.walletService.getWallet(req.user.id);
    }
}
