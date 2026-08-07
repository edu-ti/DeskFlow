import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MacrosService } from './macros.service';
import { MacrosController } from './macros.controller';
import { Macro } from './entities/macro.entity';
import { TicketsModule } from '../tickets/tickets.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Macro]),
    TicketsModule,
    NotificationsModule,
  ],
  controllers: [MacrosController],
  providers: [MacrosService],
})
export class MacrosModule {}
