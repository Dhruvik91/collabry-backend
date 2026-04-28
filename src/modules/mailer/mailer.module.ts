import { Module } from '@nestjs/common';
import { MailerModule as NestMailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppMailerService } from './mailer.service';
import { SendgridModule } from '../sendgrid/sendgrid.module';

@Module({
  imports: [
    SendgridModule,
    NestMailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('SMTP_HOST', 'smtp.gmail.com'),
          port: configService.get<number>('SMTP_PORT', 465),
          secure: configService.get<number>('SMTP_PORT', 465) === 465 ? true : false,
          auth: {
            user: configService.get<string>('SMTP_USER'),
            pass: configService.get<string>('SMTP_PASS'),
          },
        },
        defaults: {
          from: configService.get<string>('SMTP_FROM', '"Kollabary" <noreply@kollabary.com>'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AppMailerService],
  exports: [AppMailerService],
})
export class MailerConfigModule { }
