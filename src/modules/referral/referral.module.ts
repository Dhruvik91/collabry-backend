import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Referral } from '../../database/entities/referral.entity';
import { User } from '../../database/entities/user.entity';
import { ReferralService } from './referral.service';
import { ReferralController } from './referral.controller';
import { KcWalletModule } from '../kc-wallet/kc-wallet.module';
import { KCSettingModule } from '../kc-setting/kc-setting.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Referral, User]),
        KcWalletModule,
        KCSettingModule,
    ],
    controllers: [ReferralController],
    providers: [ReferralService],
    exports: [ReferralService],
})
export class ReferralModule {}
