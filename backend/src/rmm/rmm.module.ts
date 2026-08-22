import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Device } from './entities/device.entity';
import { DeviceAlert } from './entities/device-alert.entity';
import { RmmService } from './rmm.service';
import { RmmController } from './rmm.controller';
import { TicketsModule } from '../tickets/tickets.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Device, DeviceAlert]),
    forwardRef(() => TicketsModule),
  ],
  controllers: [RmmController],
  providers: [RmmService],
  exports: [RmmService],
})
export class RmmModule {}
