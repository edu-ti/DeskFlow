import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Ticket } from '../tickets/entities/ticket.entity';
import { User } from '../iam/entities/user.entity';
import { Organization } from '../organizations/entities/organization.entity';

export type FieldActivityStatus = 'scheduled' | 'traveling' | 'in_progress' | 'completed' | 'cancelled';

@Entity('field_activities')
export class FieldActivity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'ticket_id', nullable: true })
  ticket_id: number | null;

  @ManyToOne(() => Ticket, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'ticket_id' })
  ticket: Ticket;

  @Column({ name: 'technician_id', nullable: true })
  technician_id: number | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'technician_id' })
  technician: User;

  @Column({ name: 'organization_id', nullable: true })
  organization_id: number | null;

  @ManyToOne(() => Organization, { nullable: true })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'timestamp' })
  scheduled_at: Date;

  @Column({ type: 'int', default: 120 })
  estimated_duration_mins: number; // Duração estimada em minutos (padrão 2h)

  @Column({ type: 'varchar', default: 'scheduled' })
  status: FieldActivityStatus;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number | null;

  @Column({ type: 'timestamp', nullable: true })
  checkin_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  checkout_at: Date | null;

  @Column({ type: 'text', nullable: true })
  checkin_notes: string | null;

  @Column({ type: 'text', nullable: true })
  checkout_notes: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;
}
