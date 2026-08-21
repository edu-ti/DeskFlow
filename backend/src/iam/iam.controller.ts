import { Controller, Get, Post, Put, Body, HttpCode, HttpStatus, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { IamService } from './services/iam.service';
import { AuthService } from './services/auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import type { AuthenticatedRequest } from './interfaces/authenticated-request.interface';

@ApiTags('iam')
@Controller('iam')
export class IamController {
  constructor(
    private readonly iamService: IamService,
    private readonly authService: AuthService,
  ) {}

  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  @ApiOperation({ summary: 'Autentica um usuário e retorna o token JWT' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('profile')
  @ApiOperation({ summary: 'Obtém o perfil do usuário logado' })
  async getProfile(@Request() req: AuthenticatedRequest) {
    return this.iamService.getProfile(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Put('profile')
  @ApiOperation({ summary: 'Atualiza dados cadastrais e avatar do usuário logado' })
  async updateProfile(
    @Request() req: AuthenticatedRequest,
    @Body()
    body: {
      firstname?: string;
      lastname?: string;
      email?: string;
      phone?: string;
      job_title?: string;
      department?: string;
      unit?: string;
      avatar_url?: string | null;
      preferences?: string | null;
    },
  ) {
    return this.iamService.updateProfile(req.user.id, body);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Put('change-password')
  @ApiOperation({ summary: 'Altera a senha do usuário logado validando a senha atual' })
  async changePassword(
    @Request() req: AuthenticatedRequest,
    @Body() body: { current_password: string; new_password: string },
  ) {
    return this.iamService.changePassword(req.user.id, body.current_password, body.new_password);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @Post('users')
  @ApiOperation({ summary: 'Cria um novo usuário (admin)' })
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.iamService.createUser(createUserDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @Get('users')
  @ApiOperation({ summary: 'Lista todos os usuários (admin)' })
  async getUsers() {
    return this.iamService.findAllUsers();
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('groups')
  @ApiOperation({ summary: 'Lista grupos' })
  async getGroups() {
    return this.iamService.getGroups();
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('roles')
  @ApiOperation({ summary: 'Lista perfis / roles' })
  async getRoles() {
    return this.iamService.getRoles();
  }
}
