import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimeAccounting } from './entities/time-accounting.entity';
import { TimeAccountingService } from './time-accounting.service';
import { TimeAccountingController } from './time-accounting.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TimeAccounting])],
  controllers: [TimeAccountingController],
  providers: [TimeAccountingService],
  exports: [TimeAccountingService, TypeOrmModule],
})
export class TimeAccountingModule {}
