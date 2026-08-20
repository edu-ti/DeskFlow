import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { IamService } from '../services/iam.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { RolesGuard } from '../guards/roles.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Roles } from '../decorators/roles.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class UsersController {
  constructor(private readonly iamService: IamService) {}

  @Get()
  async findAll() {
    return this.iamService.findAllUsers();
  }

  @Post()
  async create(@Body() data: CreateUserDto) {
    return this.iamService.createUser(data);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() data: UpdateUserDto) {
    return this.iamService.updateUser(+id, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.iamService.deleteUser(+id);
  }
}
