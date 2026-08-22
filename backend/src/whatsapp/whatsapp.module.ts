import { Module, forwardRef } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { WhatsappCallingService } from './whatsapp-calling.service';
import { CallingMaintenanceService } from './calling-maintenance.service';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappCallingController } from './whatsapp-calling.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../iam/entities/user.entity';
import { Role } from '../iam/entities/role.entity';
import { Group } from '../iam/entities/group.entity';
import { CtiLog } from '../cti/entities/cti-log.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { TicketsModule } from '../tickets/tickets.module';
import { SettingsModule } from '../settings/settings.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuditModule } from '../audit/audit.module';
import { HttpModule } from '@nestjs/axios';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, Group, CtiLog, AuditLog]),
    forwardRef(() => TicketsModule),
    forwardRef(() => AiModule),
    SettingsModule,
    NotificationsModule,
    AuditModule,
    HttpModule
  ],
  controllers: [
    WhatsappController,
    WhatsappCallingController,
  ],
  providers: [
    WhatsappService,
    WhatsappCallingService,
    CallingMaintenanceService,
  ],
  exports: [
    WhatsappService,
    WhatsappCallingService,
  ],
})
export class WhatsappModule {}
