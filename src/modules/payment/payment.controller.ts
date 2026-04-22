import { Controller, Post, Body, UseGuards, Req, Get, Query, Param } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { InitiateTopUpDto, VerifyPaymentDto } from './dto/payment.dto';
import { JwtAuthGuard } from '../auth/Guards/jwt-guard';
import { RolesGuard } from '../auth/Guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../database/entities/enums';

@ApiTags('Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('v1/payment')
export class PaymentController {
    constructor(private readonly paymentService: PaymentService) { }

    @Post('top-up/initiate')
    @Throttle({ default: { limit: 5, ttl: 60000 } })
    @Roles(UserRole.USER, UserRole.INFLUENCER)
    @ApiOperation({ summary: 'Initiate a KC coin top-up' })
    async initiateTopUp(@Req() req: any, @Body() dto: InitiateTopUpDto) {
        return await this.paymentService.initiateTopUp(req.user.id, dto);
    }

    @Post('top-up/verify')
    @Roles(UserRole.USER, UserRole.INFLUENCER)
    @ApiOperation({ summary: 'Verify a KC coin top-up payment' })
    async verifyPayment(@Req() req: any, @Body() dto: VerifyPaymentDto) {
        return await this.paymentService.verifyPayment(req.user.id, dto);
    }

    @Get('my-orders')
    @Roles(UserRole.USER, UserRole.INFLUENCER)
    @ApiOperation({ summary: 'Get my top-up orders' })
    async getMyOrders(@Req() req: any, @Query('page') page = 1, @Query('limit') limit = 20) {
        return await this.paymentService.getMyOrders(req.user.id, Number(page), Number(limit));
    }

    @Post('top-up/cancel/:orderId')
    @Roles(UserRole.USER, UserRole.INFLUENCER)
    @ApiOperation({ summary: 'Cancel a pending KC coin top-up order' })
    async cancelOrder(@Req() req: any, @Param('orderId') orderId: string) {
        return await this.paymentService.cancelOrder(req.user.id, orderId);
    }

    @Post('top-up/sync/:orderId')
    @Roles(UserRole.USER, UserRole.INFLUENCER)
    @ApiOperation({ summary: 'Sync a pending order with Razorpay' })
    async syncOrder(@Req() req: any, @Param('orderId') orderId: string) {
        return await this.paymentService.syncOrderStatus(req.user.id, orderId);
    }

    @Post('webhook/razorpay')
    @ApiOperation({ summary: 'Razorpay Webhook handler' })
    async handleWebhook(@Body() payload: any, @Req() req: any) {
        const signature = req.headers['x-razorpay-signature'];
        const rawBody = req.rawBody?.toString();
        return await this.paymentService.handleWebhook(payload, signature, rawBody);
    }
}
