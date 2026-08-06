import { Controller, Get, Post, Body, Param, Patch, Delete, ParseIntPipe, UseGuards, Query } from '@nestjs/common';
import { CustomFieldsService } from '../services/custom-fields.service';
import { JwtAuthGuard } from '../../iam/guards/jwt-auth.guard';
import { RolesGuard } from '../../iam/guards/roles.guard';
import { Roles } from '../../iam/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('custom-fields')
export class CustomFieldsController {
  constructor(private readonly customFieldsService: CustomFieldsService) {}

  @Get()
  async findAll(@Query('groupId') groupId?: string) {
    const parsedGroupId = groupId ? parseInt(groupId, 10) : undefined;
    return this.customFieldsService.findAll(parsedGroupId);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.customFieldsService.findOne(id);
  }

  @Roles('admin')
  @Post()
  async create(@Body() createData: any) {
    return this.customFieldsService.create(createData);
  }

  @Roles('admin')
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateData: any,
  ) {
    return this.customFieldsService.update(id, updateData);
  }

  @Roles('admin')
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.customFieldsService.remove(id);
    return { success: true };
  }
}
