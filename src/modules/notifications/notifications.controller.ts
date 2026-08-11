import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
  Headers,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { ConfigService } from "@nestjs/config";
import { NotificationsService } from "./notifications.service";
import { SubscribeDto, UnsubscribeDto } from "./dto/subscribe.dto";
import { JwtAuthGuard } from "../auth/Guards/jwt-guard";
import { RolesGuard } from "../auth/Guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../../database/entities/enums";
import { AllowUnauthorized } from "../auth/unauthorized/allow-unauthorixed";

@ApiTags("Notifications")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("v1/notifications")
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly configService: ConfigService,
  ) {}

  @AllowUnauthorized()
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @Get("vapid-key")
  @ApiOperation({ summary: "Get VAPID Public Key for subscription" })
  async getVapidKey() {
    const publicKey = this.configService.get<string>("VAPID_PUBLIC_KEY");
    return { publicKey };
  }

  @Post("subscribe")
  @Roles(UserRole.INFLUENCER, UserRole.USER, UserRole.ADMIN)
  @ApiOperation({ summary: "Register browser push notification subscription" })
  async subscribe(
    @Req() req: any,
    @Body() subscribeDto: SubscribeDto,
    @Headers("user-agent") userAgent: string,
  ) {
    await this.notificationsService.registerSubscription(
      req.user.id,
      subscribeDto,
      userAgent,
    );
    return { success: true, message: "Subscription registered successfully" };
  }

  @Post("unsubscribe")
  @Roles(UserRole.INFLUENCER, UserRole.USER, UserRole.ADMIN)
  @ApiOperation({ summary: "Unsubscribe from browser push notifications" })
  async unsubscribe(@Body() unsubscribeDto: UnsubscribeDto) {
    await this.notificationsService.unregisterSubscription(
      unsubscribeDto.endpoint,
    );
    return { success: true, message: "Subscription removed successfully" };
  }
}
