import { Controller, Get, Patch, Post, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse, ApiBody, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { ReportService } from '../report/report.service';
import { VerificationService } from '../verification/verification.service';
import { SubscriptionService } from '../subscription/subscription.service';
import { UpdateReportStatusDto } from './dto/update-report-status.dto';
import { UpdateVerificationStatusDto } from './dto/update-verification-status.dto';
import { SaveSubscriptionPlanDto } from '../subscription/dto/save-subscription-plan.dto';
import { AdminStatsDto } from './dto/admin-stats.dto';
import { UserRole, ReportStatus } from '../../database/entities/enums';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/Guards/roles.guard';

@ApiTags('Admin')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@UseGuards(RolesGuard)
@Controller('v1/admin')
export class AdminController {
    constructor(
        private readonly adminService: AdminService,
        private readonly reportService: ReportService,
        private readonly verificationService: VerificationService,
        private readonly subscriptionService: SubscriptionService,
    ) { }

    // --- Statistics ---
    @Get('stats')
    @ApiOperation({ summary: 'Get platform statistics' })
    @ApiOkResponse({ description: 'Statistics retrieved successfully', type: AdminStatsDto })
    async getStatistics(): Promise<AdminStatsDto> {
        return this.adminService.getStatistics();
    }

    // --- Reports ---
    @Get('reports')
    @ApiOperation({ summary: 'List all system reports' })
    @ApiQuery({ name: 'search', required: false, type: String })
    @ApiQuery({ name: 'status', required: false, enum: ReportStatus })
    async findAllReports(
        @Query('search') search?: string,
        @Query('status') status?: ReportStatus
    ) {
        return this.reportService.getAllReports(search, status);
    }

    @Patch('reports/:id/status')
    @ApiOperation({ summary: 'Update report status' })
    async updateReportStatus(@Param('id') id: string, @Body() statusDto: UpdateReportStatusDto) {
        return this.reportService.updateReportStatus(id, statusDto.status);
    }

    // --- Verifications ---
    @Get('verifications')
    @ApiOperation({ summary: 'List all verification requests' })
    async findAllVerifications() {
        return this.verificationService.getAllRequests();
    }

    @Patch('verifications/:id/status')
    @ApiOperation({ summary: 'Update verification status' })
    async updateVerificationStatus(@Param('id') id: string, @Body() statusDto: UpdateVerificationStatusDto) {
        return this.verificationService.updateStatus(id, statusDto.status);
    }

    // --- Subscriptions ---
    @Post('subscription/plan')
    @ApiOperation({ summary: 'Create or update a subscription plan' })
    async savePlan(@Body() saveDto: SaveSubscriptionPlanDto) {
        return this.subscriptionService.createOrUpdatePlan(saveDto);
    }

    @Delete('subscription/plan/:id')
    @ApiOperation({ summary: 'Delete a subscription plan' })
    async deletePlan(@Param('id') id: string) {
        return this.subscriptionService.deletePlan(id);
    }
}
