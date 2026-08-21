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
      avatar_url: data.avatar_url !== undefined ? data.avatar_url : user.avatar_url,
      preferences: data.preferences !== undefined ? data.preferences : user.preferences,
    });
    
    if (data.is_active !== undefined) {
      user.is_active = data.is_active;
    }
    
    return this.userRepository.save(user);
  }

  async deleteUser(id: number): Promise<void> {
    await this.userRepository.delete(id);
  }

  // --- PERFIL DO USUÁRIO ---
  async getProfile(userId: number): Promise<Omit<User, 'password_hash'>> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: { roles: true, groups: true, organization: true },
    });
    if (!user) throw new ConflictException('Usuário não encontrado');
    const { password_hash, ...rest } = user;
    return rest as any;
  }

  async updateProfile(
    userId: number,
    data: {
      firstname?: string;
      lastname?: string;
      email?: string;
      phone?: string;
      job_title?: string;
      department?: string;
      unit?: string;
      avatar_url?: string | null;
      preferences?: string | null;
    },
  ): Promise<Omit<User, 'password_hash'>> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: { roles: true, groups: true, organization: true },
    });
    if (!user) throw new ConflictException('Usuário não encontrado');

    if (data.email && data.email !== user.email) {
      const existing = await this.userRepository.findOne({ where: { email: data.email } });
      if (existing && existing.id !== userId) {
        throw new ConflictException('Este e-mail já está sendo utilizado por outro usuário');
      }
      user.email = data.email;
    }

    if (data.firstname !== undefined) user.firstname = data.firstname;
    if (data.lastname !== undefined) user.lastname = data.lastname;
    if (data.phone !== undefined) user.phone = data.phone;
    if (data.job_title !== undefined) user.job_title = data.job_title;
    if (data.department !== undefined) user.department = data.department;
    if (data.unit !== undefined) user.unit = data.unit;
    if (data.avatar_url !== undefined) user.avatar_url = data.avatar_url;
    if (data.preferences !== undefined) user.preferences = data.preferences;

    const saved = await this.userRepository.save(user);
    const { password_hash, ...rest } = saved;
    return rest as any;
  }

  async changePassword(
    userId: number,
    currentPass: string,
    newPass: string,
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new ConflictException('Usuário não encontrado');

    const isValid = await bcrypt.compare(currentPass, user.password_hash);
    if (!isValid) {
      throw new ConflictException('A senha atual informada está incorreta.');
    }

    if (!newPass || newPass.length < 6) {
      throw new ConflictException('A nova senha deve ter no mínimo 6 caracteres.');
    }

    user.password_hash = await bcrypt.hash(newPass, 10);
    await this.userRepository.save(user);

    return { success: true, message: 'Senha atualizada com sucesso!' };
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
