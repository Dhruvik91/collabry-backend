import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { VideoForSale } from "../../database/entities/video-for-sale.entity";
import { VideoForSaleService } from "./video-for-sale.service";
import { VideoForSaleController } from "./video-for-sale.controller";

@Module({
  imports: [TypeOrmModule.forFeature([VideoForSale])],
  controllers: [VideoForSaleController],
  providers: [VideoForSaleService],
  exports: [VideoForSaleService],
})
export class VideoForSaleModule {}
