import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { RolesGuard } from '../iam/guards/roles.guard';
import { JwtAuthGuard } from '../iam/guards/jwt-auth.guard';
import { Roles } from '../iam/decorators/roles.decorator';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('start')
  start(@Body() body: { name?: string }) {
    return this.chatService.startSession(body?.name);
  }

  @Get(':token')
  getSession(@Param('token') token: string) {
    return this.chatService.getSessionByToken(token);
  }

  @Post(':token/messages')
  send(@Param('token') token: string, @Body() body: { content: string; from_customer?: boolean }) {
    return this.chatService.sendMessage(token, body.content, body.from_customer !== false);
  }

  @Post(':token/close')
  close(@Param('token') token: string) {
    return this.chatService.closeSession(token);
  }
}

@Controller('chat/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChatAdminController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  @Roles('admin', 'agent')
  list() {
    return this.chatService.listSessions();
  }
}
