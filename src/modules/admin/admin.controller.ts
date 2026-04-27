import { Controller, Get, Patch, Post, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import {
    ApiOkResponseEnvelope,
    ApiCreatedResponseEnvelope,
    ApiBadRequestResponseEnvelope,
    ApiUnauthorizedResponseEnvelope,
    ApiForbiddenResponseEnvelope,
    ApiNotFoundResponseEnvelope,
} from '../../core/swagger/response-envelope';
import { SuccessResponseDto } from '../../core/dto/message-response.dto';
import { AdminService } from './admin.service';
import { ReportService } from '../report/report.service';
import { VerificationService } from '../verification/verification.service';
import { SubscriptionService } from '../subscription/subscription.service';
import { UpdateReportStatusDto } from './dto/update-report-status.dto';
import { UpdateVerificationStatusDto } from './dto/update-verification-status.dto';
import { SaveSubscriptionPlanDto } from '../subscription/dto/save-subscription-plan.dto';
import { AdminStatsDto, FinanceStatsDto } from './dto/admin-stats.dto';
import { 
    AdminFinanceFilterDto, 
    AdminOrderFilterDto, 
    AdminUserFilterDto, 
    AdminBulkStatusDto 
} from './dto/admin-management.dto';
import { UserRole, ReportStatus, AuctionStatus, UserStatus } from '../../database/entities/enums';
import { KCSettingKey } from '../kc-setting/kc-setting.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/Guards/roles.guard';
import { JwtAuthGuard } from '../auth/Guards/jwt-guard';
import { User } from '../../database/entities/user.entity';
import { PaymentOrder } from '../../database/entities/payment-order.entity';
import { Report } from '../../database/entities/report.entity';
import { VerificationRequest } from '../../database/entities/verification-request.entity';
import { SubscriptionPlan } from '../../database/entities/subscription-plan.entity';
import { Auction } from '../../database/entities/auction.entity';
import { Bid } from '../../database/entities/bid.entity';
import { Conversation } from '../../database/entities/conversation.entity';
import { Message } from '../../database/entities/message.entity';

@ApiTags('Admin')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
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
    @ApiOkResponseEnvelope(AdminStatsDto)
    @ApiUnauthorizedResponseEnvelope()
    @ApiForbiddenResponseEnvelope()
    async getStatistics(@Query() filter: AdminFinanceFilterDto): Promise<AdminStatsDto> {
        return this.adminService.getStatistics(filter);
    }

    @Get('finance')
    @ApiOperation({ summary: 'Get financial statistics' })
    @ApiOkResponseEnvelope(FinanceStatsDto)
    @ApiUnauthorizedResponseEnvelope()
    @ApiForbiddenResponseEnvelope()
    async getFinanceStatistics(@Query() filter: AdminFinanceFilterDto): Promise<FinanceStatsDto> {
        return this.adminService.getFinanceStats(filter);
    }

    @Get('orders')
    @ApiOperation({ summary: 'List all platform orders with pagination/filters' })
    @ApiOkResponseEnvelope(PaymentOrder, true)
    @ApiUnauthorizedResponseEnvelope()
    @ApiForbiddenResponseEnvelope()
    async findAllOrders(@Query() filters: AdminOrderFilterDto) {
        return this.adminService.getAllOrders(filters);
    }

    @Get('users')
    @ApiOperation({ summary: 'List all platform users with pagination/filters' })
    @ApiOkResponseEnvelope(User, true)
    @ApiUnauthorizedResponseEnvelope()
    @ApiForbiddenResponseEnvelope()
    async findAllUsers(@Query() filters: AdminUserFilterDto) {
        return this.adminService.getAllUsers(filters);
    }

    @Patch('users/bulk-status')
    @ApiOperation({ summary: 'Bulk update user status (Ban/Unban)' })
    @ApiOkResponseEnvelope(SuccessResponseDto)
    @ApiUnauthorizedResponseEnvelope()
    @ApiForbiddenResponseEnvelope()
    async bulkUpdateUserStatus(@Body() bulkDto: AdminBulkStatusDto) {
        await this.adminService.bulkUpdateUserStatus(bulkDto);
        return { success: true };
    }

    @Patch('users/:id/status')
    @ApiOperation({ summary: 'Update individual user status' })
    @ApiOkResponseEnvelope(User)
    @ApiUnauthorizedResponseEnvelope()
    @ApiForbiddenResponseEnvelope()
    @ApiNotFoundResponseEnvelope('User not found')
    async updateUserStatus(@Param('id') id: string, @Body('status') status: UserStatus) {
        return this.adminService.updateUserStatus(id, status);
    }

    @Patch('users/:id/verify')
    @ApiOperation({ summary: 'Directly verify/unverify influencer' })
    @ApiOkResponseEnvelope(SuccessResponseDto)
    @ApiUnauthorizedResponseEnvelope()
    @ApiForbiddenResponseEnvelope()
    @ApiNotFoundResponseEnvelope('Influencer profile not found')
    async verifyInfluencer(@Param('id') id: string, @Body('verified') verified: boolean) {
        await this.adminService.verifyInfluencer(id, verified);
        return { success: true };
    }

    // --- Reports ---
    @Get('reports')
    @ApiOperation({ summary: 'List all system reports' })
    @ApiQuery({ name: 'search', required: false, type: String })
    @ApiQuery({ name: 'status', required: false, enum: ReportStatus })
    @ApiOkResponseEnvelope(Report, true)
    @ApiUnauthorizedResponseEnvelope()
    @ApiForbiddenResponseEnvelope()
    async findAllReports(
        @Query('search') search?: string,
        @Query('status') status?: ReportStatus
    ) {
        return this.reportService.getAllReports(search, status);
    }

    @Patch('reports/:id/status')
    @ApiOperation({ summary: 'Update report status' })
    @ApiOkResponseEnvelope(Report)
    @ApiUnauthorizedResponseEnvelope()
    @ApiForbiddenResponseEnvelope()
    @ApiNotFoundResponseEnvelope('Report not found')
    async updateReportStatus(@Param('id') id: string, @Body() statusDto: UpdateReportStatusDto) {
        return this.reportService.updateReportStatus(id, statusDto.status);
    }

    // --- Verifications ---
    @Get('verifications')
    @ApiOperation({ summary: 'List all verification requests' })
    @ApiOkResponseEnvelope(VerificationRequest, true)
    @ApiUnauthorizedResponseEnvelope()
    @ApiForbiddenResponseEnvelope()
    async findAllVerifications() {
        return this.verificationService.getAllRequests();
    }

    @Patch('verifications/:id/status')
    @ApiOperation({ summary: 'Update verification status' })
    @ApiOkResponseEnvelope(VerificationRequest)
    @ApiUnauthorizedResponseEnvelope()
    @ApiForbiddenResponseEnvelope()
    @ApiNotFoundResponseEnvelope('Verification request not found')
    async updateVerificationStatus(@Param('id') id: string, @Body() statusDto: UpdateVerificationStatusDto) {
        return this.verificationService.updateStatus(id, statusDto.status, statusDto.adminNotes);
    }

    // --- Subscriptions ---
    @Post('subscription/plan')
    @ApiOperation({ summary: 'Create or update a subscription plan' })
    @ApiOkResponseEnvelope(SubscriptionPlan)
    @ApiUnauthorizedResponseEnvelope()
    @ApiForbiddenResponseEnvelope()
    async savePlan(@Body() saveDto: SaveSubscriptionPlanDto) {
        return this.subscriptionService.createOrUpdatePlan(saveDto);
    }

    @Delete('subscription/plan/:id')
    @ApiOperation({ summary: 'Delete a subscription plan' })
    @ApiOkResponseEnvelope(SuccessResponseDto)
    @ApiUnauthorizedResponseEnvelope()
    @ApiForbiddenResponseEnvelope()
    @ApiNotFoundResponseEnvelope('Plan not found')
    async deletePlan(@Param('id') id: string) {
        await this.subscriptionService.deletePlan(id);
        return { success: true };
    }

    // --- Content Management ---
    @Get('auctions')
    @ApiOperation({ summary: 'List all auctions' })
    @ApiOkResponseEnvelope(Auction, true)
    @ApiUnauthorizedResponseEnvelope()
    @ApiForbiddenResponseEnvelope()
    async findAllAuctions(
        @Query('search') search?: string,
        @Query('status') status?: AuctionStatus
    ) {
        return this.adminService.getAllAuctions(search, status);
    }

    @Get('bids')
    @ApiOperation({ summary: 'List all bids' })
    @ApiOkResponseEnvelope(Bid, true)
    @ApiUnauthorizedResponseEnvelope()
    @ApiForbiddenResponseEnvelope()
    async findAllBids(@Query('search') search?: string) {
        return this.adminService.getAllBids(search);
    }

    @Get('conversations')
    @ApiOperation({ summary: 'List all conversations' })
    @ApiOkResponseEnvelope(Conversation, true)
    @ApiUnauthorizedResponseEnvelope()
    @ApiForbiddenResponseEnvelope()
    async findAllConversations() {
        return this.adminService.getAllConversations();
    }

    @Get('conversations/:id/messages')
    @ApiOperation({ summary: 'Get conversation messages' })
    @ApiOkResponseEnvelope(Message, true)
    @ApiUnauthorizedResponseEnvelope()
    @ApiForbiddenResponseEnvelope()
    @ApiNotFoundResponseEnvelope('Conversation not found')
    async findConversationMessages(@Param('id') id: string) {
        return this.adminService.getConversationMessages(id);
    }

    // --- Settings ---
    @Get('settings')
    @ApiOperation({ summary: 'Get all platform settings' })
    @ApiOkResponseEnvelope(Object, true)
    async findAllSettings() {
        return this.adminService.getSettings();
    }

    @Patch('settings/:key')
    @ApiOperation({ summary: 'Update a platform setting' })
    @ApiOkResponseEnvelope(Object)
    async updateSetting(
        @Param('key') key: KCSettingKey,
        @Body('value') value: number
    ) {
        return this.adminService.updateSetting(key, value);
    }
}
