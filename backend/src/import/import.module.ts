import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ticket } from '../tickets/entities/ticket.entity';
import { User } from '../iam/entities/user.entity';
import { ImportService } from './import.service';
import { ImportController } from './import.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Ticket, User])],
  controllers: [ImportController],
  providers: [ImportService],
  exports: [ImportService],
})
export class ImportModule {}
