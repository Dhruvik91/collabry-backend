import { Controller, Get, Post, Body, Req, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { InfluencerService } from './influencer.service';
import { SaveInfluencerProfileDto } from './dto/save-influencer-profile.dto';
import { SearchInfluencersDto } from './dto/search-influencers.dto';
import { AllowUnauthorized } from '../auth/unauthorized/allow-unauthorixed';
import { InfluencerProfile } from '../../database/entities/influencer-profile.entity';

@ApiTags('Influencer')
@Controller('v1/influencer')
export class InfluencerController {
    constructor(private readonly influencerService: InfluencerService) { }

    @ApiBearerAuth()
    @Get('profile')
    @ApiOperation({ summary: 'Get current user influencer profile' })
    @ApiOkResponse({ description: 'Returns the influencer profile', type: InfluencerProfile })
    async getProfile(@Req() req: any) {
        return this.influencerService.getInfluencerProfile(req.user.id);
    }

    @ApiBearerAuth()
    @Post('profile')
    @ApiOperation({ summary: 'Create or update current user influencer profile' })
    @ApiOkResponse({ description: 'Influencer profile saved successfully', type: InfluencerProfile })
    async saveProfile(@Req() req: any, @Body() saveDto: SaveInfluencerProfileDto) {
        return this.influencerService.saveInfluencerProfile(req.user.id, saveDto);
    }

    @AllowUnauthorized()
    @Get('search')
    @ApiOperation({ summary: 'Search influencers' })
    @ApiOkResponse({ description: 'Returns a paginated list of influencers' })
    async search(@Query() searchDto: SearchInfluencersDto) {
        return this.influencerService.searchInfluencers(searchDto);
    }

    @AllowUnauthorized()
    @Get(':id')
    @ApiOperation({ summary: 'Get a specific influencer profile by ID' })
    @ApiOkResponse({ description: 'Returns the influencer profile', type: InfluencerProfile })
    async getInfluencer(@Param('id') id: string) {
        return this.influencerService.getInfluencerById(id);
    }
}
