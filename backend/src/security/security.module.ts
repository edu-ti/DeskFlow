import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PgpKey } from './entities/pgp-key.entity';
import { SmimeCertificate } from './entities/smime-certificate.entity';
import { SslCertificate } from './entities/ssl-certificate.entity';
import { SecurityService } from './security.service';
import { SecurityController } from './security.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PgpKey, SmimeCertificate, SslCertificate])],
  controllers: [SecurityController],
  providers: [SecurityService],
  exports: [SecurityService, TypeOrmModule],
})
export class SecurityModule {}
