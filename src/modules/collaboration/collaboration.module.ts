import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Collaboration } from '../../database/entities/collaboration.entity';
import { CollaborationController } from './collaboration.controller';
import { CollaborationService } from './collaboration.service';

@Module({
    imports: [TypeOrmModule.forFeature([Collaboration])],
    controllers: [CollaborationController],
    providers: [CollaborationService],
    exports: [CollaborationService],
})
export class CollaborationModule { }
