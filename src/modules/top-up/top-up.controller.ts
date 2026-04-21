import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TopUpService } from './top-up.service';
import { CreateTopUpPlanDto, UpdateTopUpPlanDto } from './dto/top-up-plan.dto';
import { JwtAuthGuard } from '../auth/Guards/jwt-guard';
import { RolesGuard } from '../auth/Guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../database/entities/enums';

@ApiTags('Top-up Plans')
@Controller('v1/top-up')
export class TopUpController {
    constructor(private readonly topUpService: TopUpService) { }

    @Get('plans')
    @ApiOperation({ summary: 'Get active top-up plans' })
    async getPlans() {
        return await this.topUpService.getAllPlans(false);
    }
}

@ApiTags('Admin Top-up Plans')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('v1/admin/top-up')
export class AdminTopUpController {
    constructor(private readonly topUpService: TopUpService) { }

    @Post('plans')
    @ApiOperation({ summary: 'Create a new top-up plan' })
    async createPlan(@Body() dto: CreateTopUpPlanDto) {
        return await this.topUpService.createPlan(dto);
    }

    @Patch('plans/:id')
    @ApiOperation({ summary: 'Update a top-up plan' })
    async updatePlan(@Param('id') id: string, @Body() dto: UpdateTopUpPlanDto) {
        return await this.topUpService.updatePlan(id, dto);
    }

    @Delete('plans/:id')
    @ApiOperation({ summary: 'Delete a top-up plan' })
    async deletePlan(@Param('id') id: string) {
        return await this.topUpService.deletePlan(id);
    }

    @Get('plans')
    @ApiOperation({ summary: 'List all top-up plans (Admin)' })
    async getAllPlans() {
        return await this.topUpService.getAllPlans(true);
    }
}
