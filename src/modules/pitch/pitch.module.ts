import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Pitch } from "../../database/entities/pitch.entity";
import { User } from "../../database/entities/user.entity";
import { PitchService } from "./pitch.service";
import { PitchController } from "./pitch.controller";
import { KcWalletModule } from "../kc-wallet/kc-wallet.module";
import { KCSettingModule } from "../kc-setting/kc-setting.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Pitch, User]),
    KcWalletModule,
    KCSettingModule,
  ],
  controllers: [PitchController],
  providers: [PitchService],
  exports: [PitchService],
})
export class PitchModule {}
