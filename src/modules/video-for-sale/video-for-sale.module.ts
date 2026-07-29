import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { VideoForSale } from "../../database/entities/video-for-sale.entity";
import { VideoForSaleService } from "./video-for-sale.service";
import { VideoForSaleController } from "./video-for-sale.controller";
import { KCSettingModule } from "../kc-setting/kc-setting.module";
import { KcWalletModule } from "../kc-wallet/kc-wallet.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([VideoForSale]),
    KCSettingModule,
    KcWalletModule,
  ],
  controllers: [VideoForSaleController],
  providers: [VideoForSaleService],
  exports: [VideoForSaleService],
})
export class VideoForSaleModule {}
