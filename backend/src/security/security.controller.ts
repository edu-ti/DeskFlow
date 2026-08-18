import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { SecurityService } from './security.service';
import { PgpKey } from './entities/pgp-key.entity';
import { SmimeCertificate } from './entities/smime-certificate.entity';
import { SslCertificate } from './entities/ssl-certificate.entity';
import { RolesGuard } from '../iam/guards/roles.guard';
import { JwtAuthGuard } from '../iam/guards/jwt-auth.guard';
import { Roles } from '../iam/decorators/roles.decorator';

@Controller('security')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  @Get('pgp') listPgp() { return this.securityService.listPgp(); }
  @Post('pgp') createPgp(@Body() data: Partial<PgpKey>) { return this.securityService.createPgp(data); }
  @Patch('pgp/:id') updatePgp(@Param('id') id: string, @Body() data: Partial<PgpKey>) { return this.securityService.updatePgp(+id, data); }
  @Delete('pgp/:id') removePgp(@Param('id') id: string) { return this.securityService.removePgp(+id); }

  @Get('smime') listSmime() { return this.securityService.listSmime(); }
  @Post('smime') createSmime(@Body() data: Partial<SmimeCertificate>) { return this.securityService.createSmime(data); }
  @Patch('smime/:id') updateSmime(@Param('id') id: string, @Body() data: Partial<SmimeCertificate>) { return this.securityService.updateSmime(+id, data); }
  @Delete('smime/:id') removeSmime(@Param('id') id: string) { return this.securityService.removeSmime(+id); }

  @Get('ssl') listSsl() { return this.securityService.listSsl(); }
  @Post('ssl') createSsl(@Body() data: Partial<SslCertificate>) { return this.securityService.createSsl(data); }
  @Patch('ssl/:id') updateSsl(@Param('id') id: string, @Body() data: Partial<SslCertificate>) { return this.securityService.updateSsl(+id, data); }
  @Delete('ssl/:id') removeSsl(@Param('id') id: string) { return this.securityService.removeSsl(+id); }
}
