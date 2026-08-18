import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { Ticket } from '../tickets/entities/ticket.entity';
import { Article } from '../tickets/entities/article.entity';
import { SettingsModule } from '../settings/settings.module';
import { KbModule } from '../kb/kb.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ticket, Article]),
    SettingsModule,
    KbModule,
  ],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
