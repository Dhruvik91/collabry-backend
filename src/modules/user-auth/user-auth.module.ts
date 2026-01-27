import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../../database/entities/user.entity';
import { HashingService } from '../../core/hashing/hashing';

import { UserAuthService } from './user-auth.service';
import { UserAuthController } from './user-auth.controller';
import { LocalUserStrategy } from './strategies/local-user.strategy';
import { JwtUserStrategy } from './strategies/jwt-user.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { MailerConfigModule } from '../mailer/mailer.module';
import { RolesGuard } from '../auth/Guards/roles.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule,
    MailerConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET_KEY'),
        signOptions: { expiresIn: configService.get<string>('JWT_TOKEN_EXPIRY') },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [UserAuthController],
  providers: [UserAuthService, LocalUserStrategy, JwtUserStrategy, GoogleStrategy, HashingService, ConfigService, RolesGuard],
  exports: [UserAuthService],
})
export class UserAuthModule { }
