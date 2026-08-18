import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { Webhook } from './entities/webhook.entity';
import { RolesGuard } from '../iam/guards/roles.guard';
import { JwtAuthGuard } from '../iam/guards/jwt-auth.guard';
import { Roles } from '../iam/decorators/roles.decorator';

@Controller('webhooks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Get()
  @Roles('admin')
  findAll() {
    return this.webhooksService.findAll();
  }

  @Post()
  @Roles('admin')
  create(@Body() data: Partial<Webhook>) {
    return this.webhooksService.create(data);
  }

  @Patch(':id')
  @Roles('admin')
  update(@Param('id') id: string, @Body() data: Partial<Webhook>) {
    return this.webhooksService.update(+id, data);
  }

  @Post(':id/test')
  @Roles('admin')
  test(@Param('id') id: string, @Body() data: Record<string, any>) {
    return this.webhooksService.dispatch(+id, data);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.webhooksService.remove(+id);
  }
}
