import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PgpKey } from './entities/pgp-key.entity';
import { SmimeCertificate } from './entities/smime-certificate.entity';
import { SslCertificate } from './entities/ssl-certificate.entity';

@Injectable()
export class SecurityService {
  constructor(
    @InjectRepository(PgpKey) private readonly pgpRepository: Repository<PgpKey>,
    @InjectRepository(SmimeCertificate) private readonly smimeRepository: Repository<SmimeCertificate>,
    @InjectRepository(SslCertificate) private readonly sslRepository: Repository<SslCertificate>,
  ) {}

  // PGP
  listPgp(): Promise<PgpKey[]> { return this.pgpRepository.find(); }
  createPgp(data: Partial<PgpKey>): Promise<PgpKey> { return this.pgpRepository.save(this.pgpRepository.create(data)); }
  async updatePgp(id: number, data: Partial<PgpKey>): Promise<PgpKey> {
    const e = await this.pgpRepository.findOne({ where: { id } });
    if (!e) throw new NotFoundException('PGP key not found');
    Object.assign(e, data);
    return this.pgpRepository.save(e);
  }
  async removePgp(id: number): Promise<void> { await this.pgpRepository.delete(id); }

  // S/MIME
  listSmime(): Promise<SmimeCertificate[]> { return this.smimeRepository.find(); }
  createSmime(data: Partial<SmimeCertificate>): Promise<SmimeCertificate> { return this.smimeRepository.save(this.smimeRepository.create(data)); }
  async updateSmime(id: number, data: Partial<SmimeCertificate>): Promise<SmimeCertificate> {
    const e = await this.smimeRepository.findOne({ where: { id } });
    if (!e) throw new NotFoundException('S/MIME certificate not found');
    Object.assign(e, data);
    return this.smimeRepository.save(e);
  }
  async removeSmime(id: number): Promise<void> { await this.smimeRepository.delete(id); }

  // SSL
  listSsl(): Promise<SslCertificate[]> { return this.sslRepository.find(); }
  createSsl(data: Partial<SslCertificate>): Promise<SslCertificate> { return this.sslRepository.save(this.sslRepository.create(data)); }
  async updateSsl(id: number, data: Partial<SslCertificate>): Promise<SslCertificate> {
    const e = await this.sslRepository.findOne({ where: { id } });
    if (!e) throw new NotFoundException('SSL certificate not found');
    Object.assign(e, data);
    return this.sslRepository.save(e);
  }
  async removeSsl(id: number): Promise<void> { await this.sslRepository.delete(id); }
}
