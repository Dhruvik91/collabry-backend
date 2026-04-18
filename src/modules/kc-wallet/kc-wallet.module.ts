import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wallet } from '../../database/entities/wallet.entity';
import { KCTransaction } from '../../database/entities/kc-transaction.entity';
import { User } from '../../database/entities/user.entity';
import { WalletService } from './wallet.service';
import { KCCronService } from './kc-cron.service';
import { KCSettingModule } from '../kc-setting/kc-setting.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Wallet, KCTransaction, User]),
        KCSettingModule,
    ],
    providers: [WalletService, KCCronService],
    exports: [WalletService],
})
export class KcWalletModule {}
