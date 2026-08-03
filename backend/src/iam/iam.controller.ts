import { Controller, Get, Post, Body } from '@nestjs/common';
import { IamService } from './services/iam.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('iam')
export class IamController {
  constructor(private readonly iamService: IamService) {}

  @Post('users')
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.iamService.createUser(createUserDto);
  }

  @Get('groups')
  async getGroups() {
    return this.iamService.getGroups();
  }
}
