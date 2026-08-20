import { Controller, Get, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IamService } from './services/iam.service';
import { AuthService } from './services/auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';

@Controller('iam')
export class IamController {
  constructor(
    private readonly iamService: IamService,
    private readonly authService: AuthService,
  ) {}

  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('users')
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.iamService.createUser(createUserDto);
  }

  @Get('users')
  async getUsers() {
    return this.iamService.findAllUsers();
  }

  @Get('groups')
  async getGroups() {
    return this.iamService.getGroups();
  }

  @Get('roles')
  async getRoles() {
    return this.iamService.getRoles();
  }
}
