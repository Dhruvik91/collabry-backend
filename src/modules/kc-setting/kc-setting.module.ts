import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KCSetting } from '../../database/entities/kc-setting.entity';
import { KCSettingService } from './kc-setting.service';
import { KCSettingController } from './kc-setting.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([KCSetting]),
    ],
    controllers: [KCSettingController],
    providers: [KCSettingService],
    exports: [KCSettingService],
})
export class KCSettingModule {}
