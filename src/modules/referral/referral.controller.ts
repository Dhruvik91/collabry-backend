import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { ReferralService } from './referral.service';
import { JwtAuthGuard } from '../auth/Guards/jwt-guard';
import { RolesGuard } from '../auth/Guards/roles.guard';

@ApiTags('Referrals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('v1/referrals')
export class ReferralController {
    constructor(private readonly referralService: ReferralService) { }

    @Get('stats')
    @ApiOperation({ summary: 'Get my referral statistics' })
    async getMyStats(@Req() req: any) {
        return await this.referralService.getReferralStats(req.user.id);
    }
}
