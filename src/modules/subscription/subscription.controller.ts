import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { SubscriptionService } from './subscription.service';
import { AllowUnauthorized } from '../auth/unauthorized/allow-unauthorixed';

@ApiTags('Subscription')
@Controller('v1/subscription')
export class SubscriptionController {
    constructor(private readonly subscriptionService: SubscriptionService) { }

    @AllowUnauthorized()
    @Get('plans')
    @ApiOperation({ summary: 'List all available subscription plans' })
    @ApiOkResponse({ description: 'Returns a list of subscription plans' })
    async findAll() {
        return this.subscriptionService.getAllPlans();
    }
}
