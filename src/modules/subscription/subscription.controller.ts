import { Controller, Get, Post, Body, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import {
  ApiOkResponseEnvelope,
  ApiCreatedResponseEnvelope,
  ApiUnauthorizedResponseEnvelope,
  ApiNotFoundResponseEnvelope,
  ApiBadRequestResponseEnvelope,
} from "../../core/swagger/response-envelope";
import { SubscriptionService } from "./subscription.service";
import { AllowUnauthorized } from "../auth/unauthorized/allow-unauthorixed";
import { SubscriptionPlan } from "../../database/entities/subscription-plan.entity";
import { JwtAuthGuard } from "../auth/Guards/jwt-guard";
import { RolesGuard } from "../auth/Guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../../database/entities/enums";
import {
  InitiateSubscriptionDto,
  VerifySubscriptionDto,
} from "./dto/subscription.dto";

@ApiTags("Subscription")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("v1/subscription")
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @AllowUnauthorized()
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @Get("plans")
  @ApiOperation({ summary: "List all available subscription plans" })
  @ApiOkResponseEnvelope(SubscriptionPlan, true)
  async findAll() {
    return this.subscriptionService.getAllPlans();
  }

  @Post("initiate")
  @Roles(UserRole.USER, UserRole.INFLUENCER)
  @ApiOperation({ summary: "Initiate a Razorpay subscription" })
  @ApiCreatedResponseEnvelope(SubscriptionPlan)
  @ApiUnauthorizedResponseEnvelope()
  @ApiBadRequestResponseEnvelope(
    "User already has subscription or plan not found",
  )
  async initiate(@Req() req: any, @Body() dto: InitiateSubscriptionDto) {
    return this.subscriptionService.initiateSubscription(
      req.user.id,
      dto.planId,
    );
  }

  @Post("verify")
  @Roles(UserRole.USER, UserRole.INFLUENCER)
  @ApiOperation({ summary: "Verify subscription payment and activate" })
  @ApiOkResponseEnvelope(SubscriptionPlan)
  @ApiUnauthorizedResponseEnvelope()
  @ApiNotFoundResponseEnvelope("Subscription not found")
  @ApiBadRequestResponseEnvelope("Invalid payment signature")
  async verify(@Req() req: any, @Body() dto: VerifySubscriptionDto) {
    return this.subscriptionService.verifySubscriptionPayment(
      req.user.id,
      dto,
    );
  }

  @Post("cancel")
  @Roles(UserRole.USER, UserRole.INFLUENCER)
  @ApiOperation({ summary: "Cancel active subscription" })
  @ApiOkResponseEnvelope(SubscriptionPlan)
  @ApiUnauthorizedResponseEnvelope()
  @ApiNotFoundResponseEnvelope("No active subscription found")
  async cancel(@Req() req: any) {
    return this.subscriptionService.cancelSubscription(req.user.id);
  }
}
