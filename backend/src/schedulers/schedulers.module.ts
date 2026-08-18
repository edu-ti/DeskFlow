import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Scheduler } from './entities/scheduler.entity';
import { SchedulersService } from './schedulers.service';
import { SchedulersController } from './schedulers.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Scheduler])],
  controllers: [SchedulersController],
  providers: [SchedulersService],
  exports: [SchedulersService, TypeOrmModule],
})
export class SchedulersModule {}
