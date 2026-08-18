import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToMany, ManyToOne, JoinColumn, JoinTable } from 'typeorm';
import { Role } from './role.entity';
import { Group } from './group.entity';
import { Organization } from '../../organizations/entities/organization.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  login: string;

  @Column()
  firstname: string;

  @Column()
  lastname: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true, unique: true })
  phone: string;

  @Column({ nullable: true })
  job_title: string;

  @Column({ nullable: true })
  department: string;

  @Column({ nullable: true })
  unit: string;

  @Column({ default: true })
  is_active: boolean;

  @Column()
  password_hash: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;

  @ManyToMany(() => Role, { cascade: true })
  @JoinTable({ name: 'user_roles' })
  roles: Role[];

  @ManyToMany(() => Group, { cascade: true })
  @JoinTable({ name: 'user_groups' })
  groups: Group[];

  @Column({ name: 'organization_id', nullable: true })
  organization_id: number;

  @ManyToOne(() => Organization, (organization) => organization.members)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;
}
