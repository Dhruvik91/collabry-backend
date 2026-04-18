import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KCTransaction } from '../../database/entities/kc-transaction.entity';
import { TransactionType, TransactionPurpose } from '../../database/entities/enums';

@Injectable()
export class TransactionService {
    constructor(
        @InjectRepository(KCTransaction)
        private readonly transactionRepo: Repository<KCTransaction>,
    ) { }

    async getHistory(userId: string, page = 1, limit = 20, type?: TransactionType, purpose?: TransactionPurpose) {
        const query = this.transactionRepo.createQueryBuilder('transaction')
            .innerJoin('transaction.wallet', 'wallet')
            .innerJoin('wallet.user', 'user')
            .where('user.id = :userId', { userId })
            .orderBy('transaction.createdAt', 'DESC');

        if (type) {
            query.andWhere('transaction.type = :type', { type });
        }

        if (purpose) {
            query.andWhere('transaction.purpose = :purpose', { purpose });
        }

        const [items, total] = await query
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

        return {
            items,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getAllTransactions(page = 1, limit = 20, type?: TransactionType, purpose?: TransactionPurpose) {
        const query = this.transactionRepo.createQueryBuilder('transaction')
            .leftJoinAndSelect('transaction.wallet', 'wallet')
            .leftJoinAndSelect('wallet.user', 'user')
            .leftJoinAndSelect('user.profile', 'profile')
            .orderBy('transaction.createdAt', 'DESC');

        if (type) {
            query.andWhere('transaction.type = :type', { type });
        }

        if (purpose) {
            query.andWhere('transaction.purpose = :purpose', { purpose });
        }

        const [items, total] = await query
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

        return {
            items,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
}
