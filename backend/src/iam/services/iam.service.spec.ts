import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { IamService } from './iam.service';
import { User } from '../entities/user.entity';
import { Group } from '../entities/group.entity';
import { Role } from '../entities/role.entity';

describe('IamService', () => {
  let service: IamService;
  let mockUserRepository: Partial<Repository<User>>;

  beforeEach(async () => {
    mockUserRepository = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((d) => d),
      save: jest.fn().mockImplementation((d) => Promise.resolve(d)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IamService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: getRepositoryToken(Group), useValue: {} },
        { provide: getRepositoryToken(Role), useValue: {} },
      ],
    }).compile();

    service = module.get<IamService>(IamService);
  });

  describe('createUser', () => {
    it('hashes the provided password with bcrypt', async () => {
      const user = await service.createUser({
        login: 'jdoe',
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        password: 'secret123',
      });

      expect(user.password_hash).not.toBe('secret123');
      await expect(bcrypt.compare('secret123', user.password_hash)).resolves.toBe(true);
    });

    it('generates a random bcrypt hash when no password is provided', async () => {
      const user = await service.createUser({
        login: 'jdoe',
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
      });

      expect(user.password_hash).toBeTruthy();
      expect(user.password_hash).toMatch(/^\$2[aby]\$/);
    });

    it('throws ConflictException on duplicate email/login', async () => {
      (mockUserRepository.findOne as jest.Mock).mockResolvedValue({ id: 1 });

      await expect(
        service.createUser({
          login: 'jdoe',
          firstname: 'John',
          lastname: 'Doe',
          email: 'john@example.com',
          password: 'secret123',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateUser', () => {
    it('hashes the password when provided', async () => {
      const existing = { id: 1, login: 'jdoe', password_hash: 'old' } as User;
      (mockUserRepository.findOne as jest.Mock).mockResolvedValue(existing);

      await service.updateUser(1, { password: 'newpass123' });

      const saved = (mockUserRepository.save as jest.Mock).mock.calls[0][0];
      await expect(bcrypt.compare('newpass123', saved.password_hash)).resolves.toBe(true);
    });

    it('does not change password_hash when password is not provided', async () => {
      const existing = { id: 1, login: 'jdoe', password_hash: 'keep-me' } as User;
      (mockUserRepository.findOne as jest.Mock).mockResolvedValue(existing);

      await service.updateUser(1, { firstname: 'John' });

      const saved = (mockUserRepository.save as jest.Mock).mock.calls[0][0];
      expect(saved.password_hash).toBe('keep-me');
    });
  });
});
