import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { User } from '../../iam/entities/user.entity';

export type DeviceStatus = 'online' | 'warning' | 'critical' | 'offline';

@Entity('devices')
export class Device {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'organization_id', nullable: true })
  organization_id: number | null;

  @ManyToOne(() => Organization, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'assigned_user_id', nullable: true })
  assigned_user_id: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assigned_user_id' })
  assigned_user: User;

  @Column()
  name: string; // Hostname

  @Column({ nullable: true })
  device_type: string; // 'server' | 'workstation' | 'laptop' | 'network'

  @Column({ nullable: true })
  os_name: string; // ex: 'Windows 11 Pro 64-bit'

  @Column({ nullable: true })
  ip_address: string;

  @Column({ nullable: true })
  mac_address: string;

  @Column({ nullable: true })
  cpu_model: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  cpu_usage_percent: number;

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  ram_total_gb: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  ram_usage_percent: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  disk_total_gb: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  disk_used_gb: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  disk_usage_percent: number;

  @Column({ type: 'varchar', default: 'online' })
  status: DeviceStatus;

  @Column({ type: 'varchar', nullable: true })
  agent_version: string;

  @Column({ type: 'timestamp', nullable: true })
  last_heartbeat_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;
}
