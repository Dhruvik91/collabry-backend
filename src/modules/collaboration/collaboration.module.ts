import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Collaboration } from '../../database/entities/collaboration.entity';
import { InfluencerProfile } from '../../database/entities/influencer-profile.entity';
import { CollaborationController } from './collaboration.controller';
import { CollaborationService } from './collaboration.service';

import { User } from '../../database/entities/user.entity';
import { MailerConfigModule } from '../mailer/mailer.module';
import { RankingModule } from '../ranking/ranking.module';
import { KCCoinsModule } from '../kc-coins/kc-coins.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Collaboration, User, InfluencerProfile]),
        MailerConfigModule,
        RankingModule,
        KCCoinsModule,
    ],
    controllers: [CollaborationController],
    providers: [CollaborationService],
    exports: [CollaborationService],
})
export class CollaborationModule { }
