import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { DataPrivacyService } from './data-privacy.service';
import { DataPrivacyTask } from './entities/data-privacy-task.entity';
import { RolesGuard } from '../iam/guards/roles.guard';
import { JwtAuthGuard } from '../iam/guards/jwt-auth.guard';
import { Roles } from '../iam/decorators/roles.decorator';

@Controller('data-privacy')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class DataPrivacyController {
  constructor(private readonly dataPrivacyService: DataPrivacyService) {}

  @Get()
  list() {
    return this.dataPrivacyService.list();
  }

  @Post()
  create(@Body() data: Partial<DataPrivacyTask>) {
    return this.dataPrivacyService.create(data);
  }

  @Post(':id/execute')
  execute(@Param('id') id: string) {
    return this.dataPrivacyService.execute(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.dataPrivacyService.remove(+id);
  }
}
