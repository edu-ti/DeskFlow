import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { LdapSource } from './entities/ldap-source.entity';
import { ExternalCredential } from './entities/external-credential.entity';

const OAUTH_ENDPOINTS: Record<string, { authorize: string; token: string; scope: string }> = {
  google: {
    authorize: 'https://accounts.google.com/o/oauth2/v2/auth',
    token: 'https://oauth2.googleapis.com/token',
    scope: 'openid email profile',
  },
  microsoft365: {
    authorize: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    token: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    scope: 'openid email profile offline_access',
  },
  github: {
    authorize: 'https://github.com/login/oauth/authorize',
    token: 'https://github.com/login/oauth/access_token',
    scope: 'read:user user:email',
  },
  gitlab: {
    authorize: 'https://gitlab.com/oauth/authorize',
    token: 'https://gitlab.com/oauth/token',
    scope: 'read_user openid',
  },
  linkedin: {
    authorize: 'https://www.linkedin.com/oauth/v2/authorization',
    token: 'https://www.linkedin.com/oauth/v2/accessToken',
    scope: 'openid profile email',
  },
};

@Injectable()
export class AuthProvidersService {
  constructor(
    @InjectRepository(LdapSource)
    private readonly ldapRepository: Repository<LdapSource>,
    @InjectRepository(ExternalCredential)
    private readonly credentialRepository: Repository<ExternalCredential>,
  ) {}

  // --- LDAP Sources ---
  async listLdapSources(): Promise<LdapSource[]> {
    return this.ldapRepository.find();
  }

  async createLdapSource(data: Partial<LdapSource>): Promise<LdapSource> {
    const existing = await this.ldapRepository.findOne({ where: { name: data.name } });
    if (existing) {
      throw new ConflictException('LDAP source with this name already exists');
    }
    return this.ldapRepository.save(this.ldapRepository.create(data));
  }

  async updateLdapSource(id: number, data: Partial<LdapSource>): Promise<LdapSource> {
    const source = await this.ldapRepository.findOne({ where: { id } });
    if (!source) {
      throw new NotFoundException('LDAP source not found');
    }
    Object.assign(source, data);
    return this.ldapRepository.save(source);
  }

  async removeLdapSource(id: number): Promise<void> {
    await this.ldapRepository.softDelete(id);
  }

  // --- External Credentials (OAuth/SSO) ---
  async listCredentials(): Promise<ExternalCredential[]> {
    return this.credentialRepository.find();
  }

  async createCredential(data: Partial<ExternalCredential>): Promise<ExternalCredential> {
    return this.credentialRepository.save(this.credentialRepository.create(data));
  }

  async updateCredential(id: number, data: Partial<ExternalCredential>): Promise<ExternalCredential> {
    const credential = await this.credentialRepository.findOne({ where: { id } });
    if (!credential) {
      throw new NotFoundException('Credential not found');
    }
    Object.assign(credential, data);
    return this.credentialRepository.save(credential);
  }

  async removeCredential(id: number): Promise<void> {
    await this.credentialRepository.delete(id);
  }

  async getAuthorizeUrl(provider: string, redirectUri: string): Promise<string | null> {
    const endpoints = OAUTH_ENDPOINTS[provider];
    if (!endpoints) {
      return null;
    }
    const credential = await this.credentialRepository.findOne({ where: { provider } });
    if (!credential?.client_id) {
      return null;
    }
    const params = new URLSearchParams({
      client_id: credential.client_id,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: endpoints.scope,
    });
    return `${endpoints.authorize}?${params.toString()}`;
  }

  async exchangeCode(provider: string, code: string, redirectUri: string): Promise<any> {
    const endpoints = OAUTH_ENDPOINTS[provider];
    if (!endpoints) {
      throw new ConflictException(`Unsupported OAuth provider: ${provider}`);
    }
    const credential = await this.credentialRepository.findOne({ where: { provider } });
    if (!credential?.client_id || !credential?.client_secret) {
      throw new ConflictException(`OAuth credential not configured for ${provider}`);
    }
    const params = new URLSearchParams({
      client_id: credential.client_id,
      client_secret: credential.client_secret,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });
    const response = await axios.post(endpoints.token, params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return response.data;
  }
}
