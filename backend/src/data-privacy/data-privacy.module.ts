import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataPrivacyTask } from './entities/data-privacy-task.entity';
import { DataPrivacyService } from './data-privacy.service';
import { DataPrivacyController } from './data-privacy.controller';
import { User } from '../iam/entities/user.entity';
import { Ticket } from '../tickets/entities/ticket.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DataPrivacyTask, User, Ticket])],
  controllers: [DataPrivacyController],
  providers: [DataPrivacyService],
  exports: [DataPrivacyService, TypeOrmModule],
})
export class DataPrivacyModule {}
