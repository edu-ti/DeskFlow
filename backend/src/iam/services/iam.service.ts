import { Injectable, ConflictException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { User } from '../entities/user.entity';
import { Group } from '../entities/group.entity';
import { Role } from '../entities/role.entity';

type UserInput = Omit<Partial<User>, 'roles' | 'groups'> & {
  password?: string;
  roles?: Array<{ id: number }>;
  groups?: Array<{ id: number }>;
};

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
    const firstUser = await this.userRepository.findOne({ where: { id: 1 }, relations: { roles: true } });
    if (firstUser && (!firstUser.roles || firstUser.roles.length === 0)) {
      const adminRole = await this.roleRepository.findOne({ where: { name: 'admin' } });
      if (adminRole) {
        firstUser.roles = [adminRole];
        await this.userRepository.save(firstUser);
      }
    }
  }

  async createUser(data: UserInput): Promise<User> {
    const existing = await this.userRepository.findOne({ where: [{ email: data.email }, { login: data.login }] });
    if (existing) {
      throw new ConflictException('User with this email or login already exists');
    }

    const { password, ...rest } = data;
    const passwordToHash = password || randomBytes(16).toString('hex');
    const user = this.userRepository.create({
      ...rest,
      password_hash: await bcrypt.hash(passwordToHash, 10),
    });
    return this.userRepository.save(user);
  }

  async findUserById(id: number): Promise<User | null> {
    return this.userRepository.findOne({ where: { id }, relations: { roles: true, groups: true } });
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email }, relations: { roles: true } });
  }

  async findAllUsers(): Promise<User[]> {
    return this.userRepository.find({ relations: { roles: true, groups: true, organization: true } });
  }

  async updateUser(id: number, data: UserInput): Promise<User> {
    const user = await this.findUserById(id);
    if (!user) {
      throw new ConflictException('User not found');
    }

    if (data.password) {
      user.password_hash = await bcrypt.hash(data.password, 10);
    }
    
    // Handle roles and groups relation updates
    if (data.roles) {
      user.roles = data.roles as Role[];
    }
    if (data.groups) {
      user.groups = data.groups as Group[];
    }
    if (data.organization_id !== undefined) {
      user.organization_id = data.organization_id;
    }
    
    Object.assign(user, {
      login: data.login ?? user.login,
      firstname: data.firstname ?? user.firstname,
      lastname: data.lastname ?? user.lastname,
      email: data.email ?? user.email,
      phone: data.phone ?? user.phone,
      job_title: data.job_title ?? user.job_title,
      department: data.department ?? user.department,
      unit: data.unit ?? user.unit,
    });
    
    if (data.is_active !== undefined) {
      user.is_active = data.is_active;
    }
    
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
