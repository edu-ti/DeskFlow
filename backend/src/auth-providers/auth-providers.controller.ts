import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AuthProvidersService } from './auth-providers.service';
import { CreateLdapSourceDto, UpdateLdapSourceDto, CreateExternalCredentialDto, UpdateExternalCredentialDto } from './dto/auth-provider.dto';
import { RolesGuard } from '../iam/guards/roles.guard';
import { JwtAuthGuard } from '../iam/guards/jwt-auth.guard';
import { Roles } from '../iam/decorators/roles.decorator';

@Controller('auth-providers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuthProvidersController {
  constructor(private readonly authProvidersService: AuthProvidersService) {}

  // LDAP
  @Get('ldap')
  @Roles('admin')
  listLdap() {
    return this.authProvidersService.listLdapSources();
  }

  @Post('ldap')
  @Roles('admin')
  createLdap(@Body() data: CreateLdapSourceDto) {
    return this.authProvidersService.createLdapSource(data);
  }

  @Patch('ldap/:id')
  @Roles('admin')
  updateLdap(@Param('id') id: string, @Body() data: UpdateLdapSourceDto) {
    return this.authProvidersService.updateLdapSource(+id, data);
  }

  @Delete('ldap/:id')
  @Roles('admin')
  removeLdap(@Param('id') id: string) {
    return this.authProvidersService.removeLdapSource(+id);
  }

  // OAuth credentials
  @Get('credentials')
  @Roles('admin')
  listCredentials() {
    return this.authProvidersService.listCredentials();
  }

  @Post('credentials')
  @Roles('admin')
  createCredential(@Body() data: CreateExternalCredentialDto) {
    return this.authProvidersService.createCredential(data);
  }

  @Patch('credentials/:id')
  @Roles('admin')
  updateCredential(@Param('id') id: string, @Body() data: UpdateExternalCredentialDto) {
    return this.authProvidersService.updateCredential(+id, data);
  }

  @Delete('credentials/:id')
  @Roles('admin')
  removeCredential(@Param('id') id: string) {
    return this.authProvidersService.removeCredential(+id);
  }

  @Post('authorize-url')
  @Roles('admin', 'agent', 'customer')
  authorizeUrl(@Body() body: { provider: string; redirect_uri: string }) {
    return this.authProvidersService.getAuthorizeUrl(body.provider, body.redirect_uri);
  }

  @Post('exchange-code')
  @Roles('admin', 'agent', 'customer')
  exchangeCode(@Body() body: { provider: string; code: string; redirect_uri: string }) {
    return this.authProvidersService.exchangeCode(body.provider, body.code, body.redirect_uri);
  }
}
