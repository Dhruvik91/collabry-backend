import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Wallet } from '../../database/entities/wallet.entity';
import { UserRole, TransactionType, TransactionPurpose } from '../../database/entities/enums';
import { KCSettingService, KCSettingKey } from './kc-setting.service';
import { KCTransaction } from '../../database/entities/kc-transaction.entity';

@Injectable()
export class KCCronService {
    private readonly logger = new Logger(KCCronService.name);

    constructor(
        private readonly dataSource: DataSource,
        private readonly settingService: KCSettingService,
        @InjectRepository(Wallet)
        private readonly walletRepo: Repository<Wallet>,
    ) { }

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async handleDailyAllowance() {
        this.logger.log('Starting daily KC allowance job...');

        const brandAllowance = await this.settingService.getSetting(KCSettingKey.DAILY_ALLOWANCE_BRAND);
        const influencerAllowance = await this.settingService.getSetting(KCSettingKey.DAILY_ALLOWANCE_INFLUENCER);

        await this.dataSource.transaction(async (manager) => {
            // Bulk update for Brands (UserRole.USER)
            if (brandAllowance > 0) {
                await this.awardBulkAllowance(manager, UserRole.USER, brandAllowance);
            }

            // Bulk update for Influencers
            if (influencerAllowance > 0) {
                await this.awardBulkAllowance(manager, UserRole.INFLUENCER, influencerAllowance);
            }
        });

        this.logger.log('Daily KC allowance job completed.');
    }

    private async awardBulkAllowance(manager: any, role: UserRole, amount: number) {
        // 1. Update balances in bulk using a JOIN update
        // This is much faster than looping and handles all eligible users in one/two queries
        await manager.query(`
            UPDATE wallets
            SET balance = balance + $1, "updatedAt" = now()
            FROM users
            WHERE wallets."userId" = users.id AND users.role = $2 AND users.status = 'ACTIVE'
        `, [amount, role]);

        // 2. Record transactions in bulk
        // We need to fetch the wallet IDs to create transaction entries
        // Note: For very large datasets, bulk inserting into kc_transactions might also be needed
        const updatedWallets = await manager.query(`
            SELECT wallets.id FROM wallets 
            INNER JOIN users ON wallets."userId" = users.id 
            WHERE users.role = $1 AND users.status = 'ACTIVE'
        `, [role]);

        if (updatedWallets.length > 0) {
            const values = updatedWallets.map(w => ({
                wallet: { id: w.id },
                amount,
                type: TransactionType.CREDIT,
                purpose: TransactionPurpose.DAILY_ALLOWANCE,
            }));

            // Bulk insert transactions
            await manager.getRepository(KCTransaction).createQueryBuilder()
                .insert()
                .into(KCTransaction)
                .values(values)
                .execute();
        }
    }
}
