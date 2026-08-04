import { Injectable, ConflictException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Group } from '../entities/group.entity';
import { Role } from '../entities/role.entity';

@Injectable()
export class IamService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async onModuleInit() {
    // Seed Roles
    const roles = ['admin', 'agent', 'customer'];
    for (const roleName of roles) {
      let role = await this.roleRepository.findOne({ where: { name: roleName } });
      if (!role) {
        role = this.roleRepository.create({ name: roleName });
        await this.roleRepository.save(role);
      }
    }
    
    // Assign admin role to first user if exists and has no roles
    const firstUser = await this.userRepository.findOne({ where: { id: 1 }, relations: ['roles'] });
    if (firstUser && (!firstUser.roles || firstUser.roles.length === 0)) {
      const adminRole = await this.roleRepository.findOne({ where: { name: 'admin' } });
      if (adminRole) {
        firstUser.roles = [adminRole];
        await this.userRepository.save(firstUser);
      }
    }
  }

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
    return this.userRepository.findOne({ where: { id }, relations: ['roles', 'groups'] });
  }

  async findAllUsers(): Promise<User[]> {
    return this.userRepository.find({ relations: ['roles', 'groups'] });
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const user = await this.findUserById(id);
    if (!user) {
      throw new ConflictException('User not found');
    }
    
    // Handle roles and groups relation updates
    if (data.roles) {
      user.roles = data.roles;
    }
    if (data.groups) {
      user.groups = data.groups;
    }
    
    Object.assign(user, {
      login: data.login || user.login,
      firstname: data.firstname || user.firstname,
      lastname: data.lastname || user.lastname,
      email: data.email || user.email,
    });
    
    return this.userRepository.save(user);
  }

  async deleteUser(id: number): Promise<void> {
    await this.userRepository.delete(id);
  }

  // --- GROUPS ---
  async getGroups(): Promise<Group[]> {
    return this.groupRepository.find();
  }

  async createGroup(data: Partial<Group>): Promise<Group> {
    const group = this.groupRepository.create(data);
    return this.groupRepository.save(group);
  }

  async updateGroup(id: number, data: Partial<Group>): Promise<Group> {
    const group = await this.groupRepository.findOne({ where: { id } });
    if (!group) throw new ConflictException('Group not found');
    Object.assign(group, data);
    return this.groupRepository.save(group);
  }

  async deleteGroup(id: number): Promise<void> {
    await this.groupRepository.delete(id);
  }

  // --- ROLES ---
  async getRoles(): Promise<Role[]> {
    return this.roleRepository.find();
  }
}
