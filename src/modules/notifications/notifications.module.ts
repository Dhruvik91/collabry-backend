import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { NotificationsService } from "./notifications.service";
import { NotificationsController } from "./notifications.controller";
import { PushSubscription } from "../../database/entities/push-subscription.entity";

@Module({
  imports: [TypeOrmModule.forFeature([PushSubscription])],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
