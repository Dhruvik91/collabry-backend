import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KCTransaction } from '../../database/entities/kc-transaction.entity';
import { Wallet } from '../../database/entities/wallet.entity';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([KCTransaction, Wallet]),
    ],
    controllers: [TransactionController],
    providers: [TransactionService],
    exports: [TransactionService],
})
export class KcTransactionModule {}
