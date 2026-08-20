import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User } from '../entities/user.entity';

describe('AuthService', () => {
  let service: AuthService;
  let mockUserRepository: { findOne: jest.Mock };
  let mockJwtService: { signAsync: jest.Mock };

  beforeEach(async () => {
    mockUserRepository = { findOne: jest.fn() };
    mockJwtService = { signAsync: jest.fn().mockResolvedValue('signed-token') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('returns access token and user on valid credentials', async () => {
    const passwordHash = await bcrypt.hash('admin123', 10);
    mockUserRepository.findOne.mockResolvedValue({
      id: 1,
      email: 'admin@example.com',
      firstname: 'Admin',
      lastname: 'User',
      password_hash: passwordHash,
      roles: [{ name: 'admin' }],
    });

    const result = await service.login({ email: 'admin@example.com', password: 'admin123' });

    expect(result.access_token).toBe('signed-token');
    expect(result.user.roles).toEqual(['admin']);
  });

  it('throws UnauthorizedException on wrong password', async () => {
    const passwordHash = await bcrypt.hash('admin123', 10);
    mockUserRepository.findOne.mockResolvedValue({
      id: 1,
      email: 'admin@example.com',
      password_hash: passwordHash,
      roles: [],
    });

    await expect(
      service.login({ email: 'admin@example.com', password: 'wrongpass' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when user is not found', async () => {
    mockUserRepository.findOne.mockResolvedValue(null);

    await expect(
      service.login({ email: 'nobody@example.com', password: 'whatever1' }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
