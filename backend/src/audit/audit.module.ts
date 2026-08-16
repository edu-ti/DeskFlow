import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { AuditService } from './services/audit.service';
import { AuditController } from './controllers/audit.controller';
import { User } from '../iam/entities/user.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { Article } from '../tickets/entities/article.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuditLog, User, Ticket, Article]),
  ],
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
