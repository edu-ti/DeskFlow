import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LdapSource } from './entities/ldap-source.entity';
import { ExternalCredential } from './entities/external-credential.entity';
import { AuthProvidersService } from './auth-providers.service';
import { AuthProvidersController } from './auth-providers.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LdapSource, ExternalCredential])],
  controllers: [AuthProvidersController],
  providers: [AuthProvidersService],
  exports: [AuthProvidersService, TypeOrmModule],
})
export class AuthProvidersModule {}
