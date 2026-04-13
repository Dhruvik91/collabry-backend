import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { PublicService } from './public.service';
import { AllowUnauthorized } from '../auth/unauthorized/allow-unauthorixed';
import { PublicInfluencerProfileDto } from './dto/public-influencer-profile.dto';
import { PublicBrandProfileDto } from './dto/public-brand-profile.dto';

@ApiTags('Public')
@Controller('v1/public')
export class PublicController {
    constructor(private readonly publicService: PublicService) { }

    @AllowUnauthorized()
    @Get('influencer/:id')
    @ApiOperation({ summary: 'Get aggregate public data for an influencer' })
    @ApiOkResponse({ type: PublicInfluencerProfileDto })
    async getInfluencerData(@Param('id') id: string) {
        return this.publicService.getInfluencerPublicData(id);
    }

    @AllowUnauthorized()
    @Get('brand/:id')
    @ApiOperation({ summary: 'Get aggregate public data for a brand' })
    @ApiOkResponse({ type: PublicBrandProfileDto })
    async getBrandData(@Param('id') id: string) {
        return this.publicService.getBrandPublicData(id);
    }
}
