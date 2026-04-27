import { Controller, Get, Patch, Post, Delete, Body, Req, Query, Param, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import {
    ApiOkResponseEnvelope,
    ApiUnauthorizedResponseEnvelope,
    ApiNotFoundResponseEnvelope,
} from '../../core/swagger/response-envelope';
import { SuccessResponseDto } from '../../core/dto/message-response.dto';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SaveProfileDto } from './dto/save-profile.dto';
import { SearchProfilesDto } from './dto/search-profiles.dto';
import { UserStatusDto } from './dto/user-status.dto';
import { AllowUnauthorized } from '../auth/unauthorized/allow-unauthorixed';
import { Profile } from '../../database/entities/profile.entity';
import { JwtAuthGuard } from '../auth/Guards/jwt-guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/Guards/roles.guard';
import { UserRole } from '../../database/entities/enums';

@ApiTags('Profile')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('v1/profile')
export class ProfileController {
    constructor(private readonly profileService: ProfileService) { }

    @ApiBearerAuth()
    @Roles(UserRole.USER, UserRole.INFLUENCER, UserRole.ADMIN)
    @Get()
    @ApiOperation({ summary: 'Get current user profile' })
    @ApiOkResponseEnvelope(Profile)
    @ApiUnauthorizedResponseEnvelope()
    @ApiNotFoundResponseEnvelope('Profile not found')
    async getProfile(@Req() req: any) {
        return this.profileService.getProfile(req.user.id);
    }

    @ApiBearerAuth()
    @Roles(UserRole.USER, UserRole.INFLUENCER, UserRole.ADMIN)
    @Post()
    @Throttle({ default: { limit: 10, ttl: 60000 } })
    @ApiOperation({ summary: 'Create or update current user profile' })
    @ApiOkResponseEnvelope(Profile)
    @ApiUnauthorizedResponseEnvelope()
    async saveProfile(@Req() req: any, @Body() saveDto: SaveProfileDto) {
        return this.profileService.saveProfile(req.user.id, saveDto);
    }

    @ApiBearerAuth()
    @Roles(UserRole.USER, UserRole.INFLUENCER, UserRole.ADMIN)
    @Patch()
    @Throttle({ default: { limit: 10, ttl: 60000 } })
    @ApiOperation({ summary: 'Update current user profile' })
    @ApiOkResponseEnvelope(Profile)
    @ApiUnauthorizedResponseEnvelope()
    async updateProfile(@Req() req: any, @Body() updateDto: UpdateProfileDto) {
        return this.profileService.updateProfile(req.user.id, updateDto);
    }

    @AllowUnauthorized()
    @Get('search')
    @ApiOperation({ summary: 'Search profiles' })
    @ApiOkResponseEnvelope(Profile, true)
    async search(@Query() searchDto: SearchProfilesDto) {
        return this.profileService.searchProfiles(searchDto);
    }

    @ApiBearerAuth()
    @Roles(UserRole.USER, UserRole.INFLUENCER, UserRole.ADMIN)
    @Patch('status')
    @ApiOperation({ summary: 'Update current user status (Activate/Deactivate)' })
    @ApiOkResponseEnvelope(SuccessResponseDto)
    async updateStatus(@Req() req: any, @Body() statusDto: UserStatusDto) {
        await this.profileService.updateStatus(req.user.id, statusDto.status);
        return { success: true, message: `Account status updated to ${statusDto.status}` };
    }

    @ApiBearerAuth()
    @Roles(UserRole.USER, UserRole.INFLUENCER, UserRole.ADMIN)
    @Delete()
    @ApiOperation({ summary: 'Delete current user account' })
    @ApiOkResponseEnvelope(SuccessResponseDto)
    async deleteAccount(@Req() req: any) {
        await this.profileService.deleteAccount(req.user.id);
        return { success: true, message: 'Account deleted successfully' };
    }

    @AllowUnauthorized()
    @Get('brand/:id')
    @ApiOperation({ summary: 'Get professional brand profile with stats' })
    @ApiOkResponseEnvelope(Profile)
    @ApiNotFoundResponseEnvelope('Brand profile not found')
    async getBrandProfile(@Param('id') id: string) {
        return this.profileService.getBrandProfile(id);
    }

    @AllowUnauthorized()
    @Get(':id')
    @ApiOperation({ summary: 'Get a specific profile by ID' })
    @ApiOkResponseEnvelope(Profile)
    @ApiNotFoundResponseEnvelope('Profile not found')
    async getProfileById(@Param('id') id: string) {
        return this.profileService.getProfileById(id);
    }
}
