import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { SchedulersService } from './schedulers.service';
import { Scheduler } from './entities/scheduler.entity';
import { RolesGuard } from '../iam/guards/roles.guard';
import { JwtAuthGuard } from '../iam/guards/jwt-auth.guard';
import { Roles } from '../iam/decorators/roles.decorator';

@Controller('schedulers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SchedulersController {
  constructor(private readonly schedulersService: SchedulersService) {}

  @Get()
  @Roles('admin', 'agent')
  findAll() {
    return this.schedulersService.findAll();
  }

  @Get(':id')
  @Roles('admin')
  findOne(@Param('id') id: string) {
    return this.schedulersService.findById(+id);
  }

  @Post()
  @Roles('admin')
  create(@Body() data: Partial<Scheduler>) {
    return this.schedulersService.create(data);
  }

  @Patch(':id')
  @Roles('admin')
  update(@Param('id') id: string, @Body() data: Partial<Scheduler>) {
    return this.schedulersService.update(+id, data);
  }

  @Post(':id/run')
  @Roles('admin', 'agent')
  run(@Param('id') id: string) {
    return this.schedulersService.run(+id);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.schedulersService.remove(+id);
  }
}
