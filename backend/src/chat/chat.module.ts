import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatSession } from './entities/chat-session.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { ChatService } from './chat.service';
import { ChatController, ChatAdminController } from './chat.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ChatSession, ChatMessage])],
  controllers: [ChatController, ChatAdminController],
  providers: [ChatService],
  exports: [ChatService, TypeOrmModule],
})
export class ChatModule {}
