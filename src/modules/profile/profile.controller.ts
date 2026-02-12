import { Controller, Get, Patch, Post, Body, Req, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SaveProfileDto } from './dto/save-profile.dto';
import { SearchProfilesDto } from './dto/search-profiles.dto';
import { AllowUnauthorized } from '../auth/unauthorized/allow-unauthorixed';
import { Profile } from '../../database/entities/profile.entity';

@ApiTags('Profile')
@Controller('v1/profile')
export class ProfileController {
    constructor(private readonly profileService: ProfileService) { }

    @ApiBearerAuth()
    @Get()
    @ApiOperation({ summary: 'Get current user profile' })
    @ApiOkResponse({ description: 'Returns the user profile', type: Profile })
    async getProfile(@Req() req: any) {
        return this.profileService.getProfile(req.user.id);
    }

    @ApiBearerAuth()
    @Post()
    @ApiOperation({ summary: 'Create or update current user profile' })
    @ApiOkResponse({ description: 'Profile saved successfully', type: Profile })
    async saveProfile(@Req() req: any, @Body() saveDto: SaveProfileDto) {
        return this.profileService.saveProfile(req.user.id, saveDto);
    }

    @ApiBearerAuth()
    @Patch()
    @ApiOperation({ summary: 'Update current user profile' })
    @ApiOkResponse({ description: 'Profile updated successfully', type: Profile })
    async updateProfile(@Req() req: any, @Body() updateDto: UpdateProfileDto) {
        return this.profileService.updateProfile(req.user.id, updateDto);
    }

    @AllowUnauthorized()
    @Get('search')
    @ApiOperation({ summary: 'Search profiles' })
    @ApiOkResponse({ description: 'Returns a paginated list of profiles' }) // Paginated response is harder to type without a generic wrapper
    async search(@Query() searchDto: SearchProfilesDto) {
        return this.profileService.searchProfiles(searchDto);
    }

    @AllowUnauthorized()
    @Get(':id')
    @ApiOperation({ summary: 'Get a specific profile by ID' })
    @ApiOkResponse({ description: 'Returns the profile', type: Profile })
    async getProfileById(@Param('id') id: string) {
        return this.profileService.getProfileById(id);
    }
}
