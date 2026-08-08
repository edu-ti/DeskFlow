import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('triggers')
export class Trigger {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: 'ticket.created' })
  event_type: string; // 'ticket.created' | 'ticket.updated'

  @Column({ type: 'jsonb', default: [] })
  conditions: any[]; // e.g. [{ field: 'priority_id', operator: 'equals', value: 3 }]

  @Column({ type: 'jsonb', default: [] })
  actions: any[]; // e.g. [{ action: 'set_group', value: 2 }]

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
