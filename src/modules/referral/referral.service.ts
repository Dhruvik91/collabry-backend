import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { Referral } from '../../database/entities/referral.entity';
import { WalletService } from '../kc-wallet/wallet.service';
import { KCSettingService, KCSettingKey } from '../kc-setting/kc-setting.service';
import { TransactionPurpose } from '../../database/entities/enums';
import { randomBytes } from 'crypto';

@Injectable()
export class ReferralService {
    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        @InjectRepository(Referral)
        private readonly referralRepo: Repository<Referral>,
        private readonly walletService: WalletService,
        private readonly settingService: KCSettingService,
        private readonly dataSource: DataSource,
    ) { }

    async generateUniqueReferralCode(): Promise<string> {
        let code: string;
        let isUnique = false;
        while (!isUnique) {
            code = randomBytes(4).toString('hex').toUpperCase(); // 8 chars
            const exists = await this.userRepo.findOne({ where: { referralCode: code } });
            if (!exists) isUnique = true;
        }
        return code;
    }

    async registerReferral(referredId: string, referralCode: string, manager?: EntityManager) {
        const repo = manager ? manager.getRepository(User) : this.userRepo;
        const referralRepo = manager ? manager.getRepository(Referral) : this.referralRepo;

        const referrer = await repo.findOne({ where: { referralCode } });
        if (!referrer) return; // Silent fail or handle error? The requirement says link them.

        // Anti-self-referral check
        if (referrer.id === referredId) return;

        const referral = referralRepo.create({
            referrer,
            referred: { id: referredId } as any,
            rewarded: false,
        });
        await referralRepo.save(referral);
    }

    async rewardReferral(referredId: string) {
        const referral = await this.referralRepo.findOne({
            where: { referred: { id: referredId }, rewarded: false },
            relations: ['referrer', 'referred'],
        });

        if (!referral) return;

        const referrerReward = await this.settingService.getSetting(KCSettingKey.REFERRAL_REWARD_REFERRER);
        const referredReward = await this.settingService.getSetting(KCSettingKey.REFERRAL_REWARD_REFERRED);

        await this.dataSource.transaction(async (manager) => {
            // Reward Referrer
            if (referrerReward > 0) {
                await this.walletService.credit(
                    referral.referrer.id,
                    referrerReward,
                    TransactionPurpose.REFERRAL_REWARD,
                    { referredUserId: referredId },
                    manager
                );
            }

            // Reward Referred User
            if (referredReward > 0) {
                await this.walletService.credit(
                    referral.referred.id,
                    referredReward,
                    TransactionPurpose.SIGNUP_BONUS,
                    { referrerUserId: referral.referrer.id },
                    manager
                );
            }

            referral.rewarded = true;
            await manager.save(referral);
        });
    }

    async getReferralStats(userId: string) {
        const [totalReferrals, awardedReferrals] = await Promise.all([
            this.referralRepo.count({ where: { referrer: { id: userId } } }),
            this.referralRepo.find({ 
                where: { referrer: { id: userId }, rewarded: true },
                relations: ['referred']
            })
        ]);

        const totalEarned = awardedReferrals.length * (await this.settingService.getSetting(KCSettingKey.REFERRAL_REWARD_REFERRER));

        return {
            totalReferrals,
            successfulReferrals: awardedReferrals.length,
            totalEarned,
            referralCode: (await this.userRepo.findOne({ where: { id: userId } }))?.referralCode
        };
    }
}
