import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KCSetting } from '../../database/entities/kc-setting.entity';

export enum KCSettingKey {
    AUCTION_CREATION_PRICE = 'AUCTION_CREATION_PRICE',
    COLLABORATION_CREATION_PRICE = 'COLLABORATION_CREATION_PRICE',
    BID_PLACEMENT_PRICE = 'BID_PLACEMENT_PRICE',
    DAILY_ALLOWANCE_BRAND = 'DAILY_ALLOWANCE_BRAND',
    DAILY_ALLOWANCE_INFLUENCER = 'DAILY_ALLOWANCE_INFLUENCER',
    REFERRAL_REWARD_REFERRER = 'REFERRAL_REWARD_REFERRER',
    REFERRAL_REWARD_REFERRED = 'REFERRAL_REWARD_REFERRED',
}

@Injectable()
export class KCSettingService implements OnModuleInit {
    constructor(
        @InjectRepository(KCSetting)
        private readonly settingRepo: Repository<KCSetting>,
    ) { }

    async onModuleInit() {
        // Initialize default settings if they don't exist
        const defaults = [
            { key: KCSettingKey.AUCTION_CREATION_PRICE, value: 250 },
            { key: KCSettingKey.COLLABORATION_CREATION_PRICE, value: 200 },
            { key: KCSettingKey.BID_PLACEMENT_PRICE, value: 25 },
            { key: KCSettingKey.DAILY_ALLOWANCE_BRAND, value: 1000 },
            { key: KCSettingKey.DAILY_ALLOWANCE_INFLUENCER, value: 500 },
            { key: KCSettingKey.REFERRAL_REWARD_REFERRER, value: 2000 },
            { key: KCSettingKey.REFERRAL_REWARD_REFERRED, value: 500 },
        ];

        for (const item of defaults) {
            const exists = await this.settingRepo.findOne({ where: { key: item.key } });
            if (!exists) {
                await this.settingRepo.save(this.settingRepo.create(item));
            }
        }
    }

    async getSetting(key: KCSettingKey): Promise<number> {
        const setting = await this.settingRepo.findOne({ where: { key } });
        return setting ? Number(setting.value) : 0;
    }

    async getAllSettings(): Promise<KCSetting[]> {
        return await this.settingRepo.find();
    }

    async updateSetting(key: KCSettingKey, value: number): Promise<KCSetting> {
        let setting = await this.settingRepo.findOne({ where: { key } });
        if (!setting) {
            setting = this.settingRepo.create({ key, value });
        } else {
            setting.value = value;
        }
        return await this.settingRepo.save(setting);
    }
}
