import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import {
    ApiOkResponseEnvelope,
    ApiCreatedResponseEnvelope,
    ApiUnauthorizedResponseEnvelope,
    ApiForbiddenResponseEnvelope,
    ApiNotFoundResponseEnvelope,
} from '../../core/swagger/response-envelope';
import { SuccessResponseDto } from '../../core/dto/message-response.dto';
import { TopUpService } from './top-up.service';
import { CreateTopUpPlanDto, UpdateTopUpPlanDto } from './dto/top-up-plan.dto';
import { JwtAuthGuard } from '../auth/Guards/jwt-guard';
import { RolesGuard } from '../auth/Guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../database/entities/enums';
import { TopUpPlan } from '../../database/entities/top-up-plan.entity';

@ApiTags('Top-up Plans')
@Controller('v1/top-up')
export class TopUpController {
    constructor(private readonly topUpService: TopUpService) { }

    @Get('plans')
    @ApiOperation({ summary: 'Get active top-up plans' })
    @ApiOkResponseEnvelope(TopUpPlan, true)
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
    @ApiCreatedResponseEnvelope(TopUpPlan)
    @ApiUnauthorizedResponseEnvelope()
    @ApiForbiddenResponseEnvelope('Only admins can create plans')
    async createPlan(@Body() dto: CreateTopUpPlanDto) {
        return await this.topUpService.createPlan(dto);
    }

    @Patch('plans/:id')
    @ApiOperation({ summary: 'Update a top-up plan' })
    @ApiOkResponseEnvelope(TopUpPlan)
    @ApiUnauthorizedResponseEnvelope()
    @ApiForbiddenResponseEnvelope('Only admins can update plans')
    @ApiNotFoundResponseEnvelope('Plan not found')
    async updatePlan(@Param('id') id: string, @Body() dto: UpdateTopUpPlanDto) {
        return await this.topUpService.updatePlan(id, dto);
    }

    @Delete('plans/:id')
    @ApiOperation({ summary: 'Delete a top-up plan' })
    @ApiOkResponseEnvelope(SuccessResponseDto)
    @ApiUnauthorizedResponseEnvelope()
    @ApiForbiddenResponseEnvelope('Only admins can delete plans')
    @ApiNotFoundResponseEnvelope('Plan not found')
    async deletePlan(@Param('id') id: string) {
        await this.topUpService.deletePlan(id);
        return { success: true };
    }

    @Get('plans')
    @ApiOperation({ summary: 'List all top-up plans (Admin)' })
    @ApiOkResponseEnvelope(TopUpPlan, true)
    @ApiUnauthorizedResponseEnvelope()
    @ApiForbiddenResponseEnvelope('Only admins can list all plans')
    async getAllPlans() {
        return await this.topUpService.getAllPlans(true);
    }
}
