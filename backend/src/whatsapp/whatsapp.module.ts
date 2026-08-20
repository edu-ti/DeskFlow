import { Module, forwardRef } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { WhatsappCallingService } from './whatsapp-calling.service';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappCallingController } from './whatsapp-calling.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../iam/entities/user.entity';
import { Role } from '../iam/entities/role.entity';
import { CtiLog } from '../cti/entities/cti-log.entity';
import { TicketsModule } from '../tickets/tickets.module';
import { SettingsModule } from '../settings/settings.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { HttpModule } from '@nestjs/axios';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, CtiLog]),
    forwardRef(() => TicketsModule),
    forwardRef(() => AiModule),
    SettingsModule,
    NotificationsModule,
    HttpModule
  ],
  controllers: [WhatsappController, WhatsappCallingController],
  providers: [WhatsappService, WhatsappCallingService],
  exports: [WhatsappService, WhatsappCallingService]
})
export class WhatsappModule {}
