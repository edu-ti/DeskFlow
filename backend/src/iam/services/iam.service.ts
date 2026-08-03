import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Group } from '../entities/group.entity';

@Injectable()
export class IamService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
  ) {}

  async createUser(data: Partial<User>): Promise<User> {
    const existing = await this.userRepository.findOne({ where: [{ email: data.email }, { login: data.login }] });
    if (existing) {
      throw new ConflictException('User with this email or login already exists');
    }

    const user = this.userRepository.create(data);
    // Em um sistema real, a senha (data.password) seria hasheada aqui antes de salvar
    return this.userRepository.save(user);
  }

  async findUserById(id: number): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async getGroups(): Promise<Group[]> {
    return this.groupRepository.find();
  }
}
