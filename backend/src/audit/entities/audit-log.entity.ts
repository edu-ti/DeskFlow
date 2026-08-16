import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../iam/entities/user.entity';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', nullable: true })
  user_id: number;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  action: string; // TICKET_CREATE, TICKET_UPDATE, TICKET_DELETE, USER_ANONYMIZE, SETTINGS_CHANGE, DATA_EXPORT, LOGIN

  @Column({ name: 'entity_type', nullable: true })
  entity_type: string; // ticket, user, setting, report, auth

  @Column({ name: 'entity_id', nullable: true })
  entity_id: string;

  @Column({ name: 'ip_address', nullable: true })
  ip_address: string;

  @Column({ name: 'user_agent', nullable: true })
  user_agent: string;

  @Column({ type: 'jsonb', nullable: true })
  old_values: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  new_values: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn()
  created_at: Date;
}
