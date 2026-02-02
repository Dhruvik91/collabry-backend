import { Controller, Get, Patch, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@ApiTags('Profile')
@ApiBearerAuth()
@Controller('v1/profile')
export class ProfileController {
    constructor(private readonly profileService: ProfileService) { }

    @Get()
    @ApiOperation({ summary: 'Get current user profile' })
    @ApiOkResponse({ description: 'Returns the user profile' })
    async getProfile(@Req() req: any) {
        return this.profileService.getProfile(req.user.id);
    }

    @Patch()
    @ApiOperation({ summary: 'Update current user profile' })
    @ApiOkResponse({ description: 'Profile updated successfully' })
    async updateProfile(@Req() req: any, @Body() updateDto: UpdateProfileDto) {
        return this.profileService.updateProfile(req.user.id, updateDto);
    }
}
