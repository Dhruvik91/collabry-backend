import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
    ApiOkResponseEnvelope,
} from '../../core/swagger/response-envelope';
import { SubscriptionService } from './subscription.service';
import { AllowUnauthorized } from '../auth/unauthorized/allow-unauthorixed';
import { SubscriptionPlan } from '../../database/entities/subscription-plan.entity';

@ApiTags('Subscription')
@Controller('v1/subscription')
export class SubscriptionController {
    constructor(private readonly subscriptionService: SubscriptionService) { }

    @AllowUnauthorized()
    @Get('plans')
    @ApiOperation({ summary: 'List all available subscription plans' })
    @ApiOkResponseEnvelope(SubscriptionPlan, true)
    async findAll() {
        return this.subscriptionService.getAllPlans();
    }
}
