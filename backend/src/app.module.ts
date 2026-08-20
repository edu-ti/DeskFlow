import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
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
import { TicketLink } from './tickets/entities/ticket-link.entity';
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
import { AiModule } from './ai/ai.module';
import { AuditLog } from './audit/entities/audit-log.entity';
import { AuditModule } from './audit/audit.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { Organization } from './organizations/entities/organization.entity';
import { TagsModule } from './tags/tags.module';
import { Tag } from './tags/entities/tag.entity';
import { TicketTag } from './tags/entities/ticket-tag.entity';
import { OverviewsModule } from './overviews/overviews.module';
import { Overview } from './overviews/entities/overview.entity';
import { TextModulesModule } from './text-modules/text-modules.module';
import { TextModule } from './text-modules/entities/text-module.entity';
import { ChecklistsModule } from './checklists/checklists.module';
import { Checklist } from './checklists/entities/checklist.entity';
import { ChecklistItem } from './checklists/entities/checklist-item.entity';
import { MentionsModule } from './mentions/mentions.module';
import { Mention } from './mentions/entities/mention.entity';
import { TimeAccountingModule } from './time-accounting/time-accounting.module';
import { TimeAccounting } from './time-accounting/entities/time-accounting.entity';
import { ChatModule } from './chat/chat.module';
import { ChatSession } from './chat/entities/chat-session.entity';
import { ChatMessage } from './chat/entities/chat-message.entity';
import { CtiModule } from './cti/cti.module';
import { CtiLog } from './cti/entities/cti-log.entity';
import { SmsModule } from './sms/sms.module';
import { TelegramModule } from './telegram/telegram.module';
import { FacebookModule } from './facebook/facebook.module';
import { PostmasterFiltersModule } from './postmaster-filters/postmaster-filters.module';
import { PostmasterFilter } from './postmaster-filters/entities/postmaster-filter.entity';
import { AuthProvidersModule } from './auth-providers/auth-providers.module';
import { LdapSource } from './auth-providers/entities/ldap-source.entity';
import { ExternalCredential } from './auth-providers/entities/external-credential.entity';
import { SecurityModule } from './security/security.module';
import { PgpKey } from './security/entities/pgp-key.entity';
import { SmimeCertificate } from './security/entities/smime-certificate.entity';
import { SslCertificate } from './security/entities/ssl-certificate.entity';
import { DataPrivacyModule } from './data-privacy/data-privacy.module';
import { DataPrivacyTask } from './data-privacy/entities/data-privacy-task.entity';
import { SchedulersModule } from './schedulers/schedulers.module';
import { Scheduler } from './schedulers/entities/scheduler.entity';
import { WebhooksModule } from './webhooks/webhooks.module';
import { Webhook } from './webhooks/entities/webhook.entity';
import { ImportModule } from './import/import.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { PublicLinksModule } from './public-links/public-links.module';
import { PublicLink } from './public-links/entities/public-link.entity';

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
        entities: [User, Group, Role, Organization, Tag, TicketTag, Overview, TextModule, Checklist, ChecklistItem, Mention, TimeAccounting, ChatSession, ChatMessage, CtiLog, PostmasterFilter, LdapSource, ExternalCredential, PgpKey, SmimeCertificate, SslCertificate, DataPrivacyTask, Scheduler, Webhook, PublicLink, Ticket, Article, TicketHistory, TicketLink, CustomField, TicketCustomFieldValue, Notification, KbCategory, KbArticle, Macro, Trigger, Setting, SlaPolicy, AuditLog],
        synchronize: configService.get<string>('DB_SYNCHRONIZE', 'true') === 'true', // true apenas em dev; em produção defina DB_SYNCHRONIZE=false e use migrations
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
    OrganizationsModule,
    TagsModule,
    OverviewsModule,
    TextModulesModule,
    ChecklistsModule,
    MentionsModule,
    TimeAccountingModule,
    ChatModule,
    CtiModule,
    SmsModule,
    TelegramModule,
    FacebookModule,
    PostmasterFiltersModule,
    AuthProvidersModule,
    SecurityModule,
    DataPrivacyModule,
    SchedulersModule,
    WebhooksModule,
    ImportModule,
    IntegrationsModule,
    PublicLinksModule,
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
    AiModule,
    AuditModule,
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
