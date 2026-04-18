import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { Wallet } from '../../database/entities/wallet.entity';
import { User } from '../../database/entities/user.entity';
import { KCTransaction } from '../../database/entities/kc-transaction.entity';
import { TransactionType, TransactionPurpose } from '../../database/entities/enums';

@Injectable()
export class WalletService {
    constructor(
        @InjectRepository(Wallet)
        private readonly walletRepo: Repository<Wallet>,
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        private readonly dataSource: DataSource,
    ) { }

    async getWallet(userId: string): Promise<Wallet> {
        const wallet = await this.walletRepo.findOne({
            where: { user: { id: userId } },
        });
        if (!wallet) throw new NotFoundException('Wallet not found');
        return wallet;
    }

    async createWallet(userId: string, initialBalance = 0, manager?: EntityManager): Promise<Wallet> {
        const repo = manager ? manager.getRepository(Wallet) : this.walletRepo;
        
        const existing = await repo.findOne({ where: { user: { id: userId } } });
        if (existing) return existing;

        const wallet = repo.create({
            user: { id: userId } as any,
            balance: initialBalance,
        });
        return await repo.save(wallet);
    }

    async debit(userId: string, amount: number, purpose: TransactionPurpose, metadata?: any, manager?: EntityManager): Promise<KCTransaction> {
        return await this.runInTransaction(async (transactionalManager) => {
            const wallet = await transactionalManager.findOne(Wallet, {
                where: { user: { id: userId } },
                lock: { mode: 'pessimistic_write' },
            });

            if (!wallet) throw new NotFoundException('Wallet not found');
            if (Number(wallet.balance) < amount) {
                throw new BadRequestException(`Insufficient KC coins. Required: ${amount}, Available: ${wallet.balance}`);
            }

            // Update balance
            wallet.balance = Number(wallet.balance) - amount;
            await transactionalManager.save(wallet);

            // Record transaction
            const transaction = transactionalManager.create(KCTransaction, {
                wallet,
                amount,
                type: TransactionType.DEBIT,
                purpose,
                metadata,
            });
            return await transactionalManager.save(transaction);
        }, manager);
    }

    async credit(userId: string, amount: number, purpose: TransactionPurpose, metadata?: any, manager?: EntityManager): Promise<KCTransaction> {
        return await this.runInTransaction(async (transactionalManager) => {
            let wallet = await transactionalManager.findOne(Wallet, {
                where: { user: { id: userId } },
                lock: { mode: 'pessimistic_write' },
            });

            if (!wallet) {
                // Auto-create wallet if it doesn't exist
                wallet = await this.createWallet(userId, 0, transactionalManager);
            }

            // Update balance
            wallet.balance = Number(wallet.balance) + amount;
            await transactionalManager.save(wallet);

            // Record transaction
            const transaction = transactionalManager.create(KCTransaction, {
                wallet,
                amount,
                type: TransactionType.CREDIT,
                purpose,
                metadata,
            });
            return await transactionalManager.save(transaction);
        }, manager);
    }

    private async runInTransaction<T>(work: (manager: EntityManager) => Promise<T>, existingManager?: EntityManager): Promise<T> {
        if (existingManager) {
            return await work(existingManager);
        } else {
            return await this.dataSource.transaction(work);
        }
    }
}
