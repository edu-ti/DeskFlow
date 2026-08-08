import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { IamModule } from './iam/iam.module';
import { TicketsModule } from './tickets/tickets.module';
import { User } from './iam/entities/user.entity';
import { Group } from './iam/entities/group.entity';
import { Ticket } from './tickets/entities/ticket.entity';
import { Article } from './tickets/entities/article.entity';
import { TicketHistory } from './tickets/entities/ticket-history.entity';
import { CustomField } from './tickets/entities/custom-field.entity';
import { TicketCustomFieldValue } from './tickets/entities/ticket-custom-field-value.entity';
import { BullModule } from '@nestjs/bullmq';
import { Role } from './iam/entities/role.entity';
import { Notification } from './notifications/entities/notification.entity';
import { NotificationsModule } from './notifications/notifications.module';
import { KbModule } from './kb/kb.module';
import { Category as KbCategory } from './kb/entities/category.entity';
import { Article as KbArticle } from './kb/entities/article.entity';
import { ReportsModule } from './reports/reports.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { MacrosModule } from './macros/macros.module';
import { Macro } from './macros/entities/macro.entity';
import { EmailModule } from './email/email.module';
import { TriggersModule } from './triggers/triggers.module';
import { Trigger } from './triggers/entities/trigger.entity';
import { SearchModule } from './search/search.module';
import { SettingsModule } from './settings/settings.module';
import { Setting } from './settings/entities/setting.entity';
import { AnalyticsModule } from './analytics/analytics.module';
import { SlaPolicy } from './sla/entities/sla-policy.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USER', 'deskflow'),
        password: configService.get<string>('DB_PASS', 'deskflow_password'),
        database: configService.get<string>('DB_NAME', 'deskflow_db'),
        entities: [User, Group, Role, Ticket, Article, TicketHistory, CustomField, TicketCustomFieldValue, Notification, KbCategory, KbArticle, Macro, Trigger, Setting, SlaPolicy],
        synchronize: true, // APENAS PARA DESENVOLVIMENTO: cria tabelas automaticamente
      }),
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6380),
        },
      }),
    }),
    IamModule, 
    TicketsModule,
    NotificationsModule,
    KbModule,
    ReportsModule,
    MacrosModule,
    EmailModule,
    TriggersModule,
    SearchModule,
    SettingsModule,
    AnalyticsModule,
    WhatsappModule,
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot()
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
