import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AllEntities, CustomRepository } from '.';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature(AllEntities)],
  providers: [...CustomRepository],
  exports: [TypeOrmModule.forFeature(AllEntities), ...CustomRepository],
})
export class DatabaseModule {}
