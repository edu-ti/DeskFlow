import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { IamService } from '../services/iam.service';
import { CreateGroupDto, UpdateGroupDto } from '../dto/group.dto';
import { RolesGuard } from '../guards/roles.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Roles } from '../decorators/roles.decorator';

@Controller('groups')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class GroupsController {
  constructor(private readonly iamService: IamService) {}

  @Get()
  async findAll() {
    return this.iamService.getGroups();
  }

  @Post()
  async create(@Body() data: CreateGroupDto) {
    return this.iamService.createGroup(data);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() data: UpdateGroupDto) {
    return this.iamService.updateGroup(+id, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.iamService.deleteGroup(+id);
  }
}
