import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TopUpPlan } from '../../database/entities/top-up-plan.entity';
import { TopUpService } from './top-up.service';
import { TopUpController, AdminTopUpController } from './top-up.controller';

@Module({
    imports: [TypeOrmModule.forFeature([TopUpPlan])],
    providers: [TopUpService],
    controllers: [TopUpController, AdminTopUpController],
    exports: [TopUpService],
})
export class TopUpModule { }
