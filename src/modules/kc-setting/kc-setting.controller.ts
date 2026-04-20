import { Controller, Get, Patch, Body, UseGuards, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { KCSettingService, KCSettingKey } from './kc-setting.service';
import { UserRole } from '../../database/entities/enums';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/Guards/roles.guard';
import { JwtAuthGuard } from '../auth/Guards/jwt-guard';
import { UpdateSettingDto } from './dto/update-setting.dto';


@ApiTags('KC Coins Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('v1/admin/kc-settings')
export class KCSettingController {
    constructor(private readonly settingService: KCSettingService) { }

    @Get()
    @Roles(UserRole.ADMIN, UserRole.USER, UserRole.INFLUENCER)
    @ApiOperation({ summary: 'Get all KC coin settings' })
    async getAll() {
        return await this.settingService.getAllSettings();
    }

    @Patch(':key')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Update a KC coin setting' })
    async update(@Param('key') key: KCSettingKey, @Body() dto: UpdateSettingDto) {
        return await this.settingService.updateSetting(key, dto.value);
    }
}
