import { Controller, Get, Post, Patch, Body, Req, Query, Param, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { InfluencerService } from './influencer.service';
import { SaveInfluencerProfileDto } from './dto/save-influencer-profile.dto';
import { SearchInfluencersDto } from './dto/search-influencers.dto';
import { AllowUnauthorized } from '../auth/unauthorized/allow-unauthorixed';
import { InfluencerProfile } from '../../database/entities/influencer-profile.entity';
import { JwtAuthGuard } from '../auth/Guards/jwt-guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/Guards/roles.guard';
import { UserRole } from '../../database/entities/enums';

@ApiTags('Influencer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('v1/influencer')
export class InfluencerController {
    constructor(private readonly influencerService: InfluencerService) { }

    @ApiBearerAuth()
    @Roles(UserRole.INFLUENCER, UserRole.ADMIN)
    @Get('profile')
    @ApiOperation({ summary: 'Get current user influencer profile' })
    @ApiOkResponse({ description: 'Returns the influencer profile', type: InfluencerProfile })
    async getProfile(@Req() req: any) {
        return this.influencerService.getInfluencerProfile(req.user.id);
    }

    @ApiBearerAuth()
    @Roles(UserRole.INFLUENCER)
    @Post('profile')
    @Throttle({ default: { limit: 10, ttl: 60000 } })
    @ApiOperation({ summary: 'Create current user influencer profile' })
    @ApiOkResponse({ description: 'Influencer profile created successfully', type: InfluencerProfile })
    async createProfile(@Req() req: any, @Body() saveDto: SaveInfluencerProfileDto) {
        return this.influencerService.saveInfluencerProfile(req.user.id, saveDto);
    }

    @ApiBearerAuth()
    @Roles(UserRole.INFLUENCER)
    @Patch('profile')
    @Throttle({ default: { limit: 10, ttl: 60000 } })
    @ApiOperation({ summary: 'Update current user influencer profile' })
    @ApiOkResponse({ description: 'Influencer profile updated successfully', type: InfluencerProfile })
    async updateProfile(@Req() req: any, @Body() saveDto: SaveInfluencerProfileDto) {
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
