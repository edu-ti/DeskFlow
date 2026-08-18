import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mention } from './entities/mention.entity';
import { MentionsService } from './mentions.service';
import { MentionsController } from './mentions.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([Mention]), NotificationsModule],
  controllers: [MentionsController],
  providers: [MentionsService],
  exports: [MentionsService, TypeOrmModule],
})
export class MentionsModule {}
