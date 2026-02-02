import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Collaboration } from '../../database/entities/collaboration.entity';
import { CollaborationController } from './collaboration.controller';
import { CollaborationService } from './collaboration.service';

import { User } from '../../database/entities/user.entity';
import { MailerConfigModule } from '../mailer/mailer.module';

@Module({
    imports: [TypeOrmModule.forFeature([Collaboration, User]), MailerConfigModule],
    controllers: [CollaborationController],
    providers: [CollaborationService],
    exports: [CollaborationService],
})
export class CollaborationModule { }
