import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { TriggersService } from './triggers.service';
import { JwtAuthGuard } from '../iam/guards/jwt-auth.guard';
import { RolesGuard } from '../iam/guards/roles.guard';
import { Roles } from '../iam/decorators/roles.decorator';

@Controller('triggers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class TriggersController {
  constructor(private readonly triggersService: TriggersService) {}

  @Post()
  create(@Body() createTriggerDto: any) {
    return this.triggersService.create(createTriggerDto);
  }

  @Get()
  findAll() {
    return this.triggersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.triggersService.findOne(+id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateTriggerDto: any) {
    return this.triggersService.update(+id, updateTriggerDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.triggersService.remove(+id);
  }
}
