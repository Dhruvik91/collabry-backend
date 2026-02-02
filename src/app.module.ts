import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { TypeOrmConnectionModule } from './database/typeorm-root.module';
import { DatabaseModule } from './database/database.module';
import { AttachmentsModule } from './modules/attachments/attachments.module';
import { AwsModule } from './modules/aws/aws.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { UserAuthModule } from './modules/user-auth/user-auth.module';
import { ProfileModule } from './modules/profile/profile.module';
import { InfluencerModule } from './modules/influencer/influencer.module';

@Module({
  imports: [
    TypeOrmConnectionModule,
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,

    // Core modules
    UserAuthModule,
    ProfileModule,
    InfluencerModule,

    // Utility modules
    AttachmentsModule,
    AwsModule,
    UploadsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
