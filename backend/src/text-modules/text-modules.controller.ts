import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { TextModulesService } from './text-modules.service';
import { CreateTextModuleDto, UpdateTextModuleDto } from './dto/text-module.dto';
import { RolesGuard } from '../iam/guards/roles.guard';
import { JwtAuthGuard } from '../iam/guards/jwt-auth.guard';
import { Roles } from '../iam/decorators/roles.decorator';

@Controller('text-modules')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TextModulesController {
  constructor(private readonly textModulesService: TextModulesService) {}

  @Get()
  @Roles('admin', 'agent')
  findAll() {
    return this.textModulesService.findAll();
  }

  @Get('active')
  @Roles('admin', 'agent')
  findActive() {
    return this.textModulesService.findActive();
  }

  @Get(':id')
  @Roles('admin', 'agent')
  findOne(@Param('id') id: string) {
    return this.textModulesService.findById(+id);
  }

  @Post()
  @Roles('admin')
  create(@Body() data: CreateTextModuleDto) {
    return this.textModulesService.create(data);
  }

  @Patch(':id')
  @Roles('admin')
  update(@Param('id') id: string, @Body() data: UpdateTextModuleDto) {
    return this.textModulesService.update(+id, data);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.textModulesService.remove(+id);
  }
}
