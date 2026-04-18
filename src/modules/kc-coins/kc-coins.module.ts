import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wallet } from '../../database/entities/wallet.entity';
import { KCTransaction } from '../../database/entities/kc-transaction.entity';
import { KCSetting } from '../../database/entities/kc-setting.entity';
import { Referral } from '../../database/entities/referral.entity';
import { User } from '../../database/entities/user.entity';
import { WalletService } from './wallet.service';
import { TransactionService } from './transaction.service';
import { KCSettingService } from './kc-setting.service';
import { ReferralService } from './referral.service';
import { KCSettingController } from './kc-setting.controller';
import { TransactionController } from './transaction.controller';
import { ReferralController } from './referral.controller';
import { KCCronService } from './kc-cron.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Wallet, KCTransaction, KCSetting, Referral, User]),
    ],
    controllers: [KCSettingController, TransactionController, ReferralController],
    providers: [
        WalletService,
        TransactionService,
        KCSettingService,
        ReferralService,
        KCCronService,
    ],
    exports: [WalletService, TransactionService, KCSettingService, ReferralService],
})
export class KCCoinsModule {}
