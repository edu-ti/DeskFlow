import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('schedulers')
export class Scheduler {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ default: 'Ticket' })
  object: string;

  @Column({ type: 'jsonb', nullable: true })
  condition: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  perform: Record<string, any>;

  @Column({ nullable: true })
  period: string;

  @Column({ default: true })
  active: boolean;

  @Column({ type: 'timestamp', nullable: true })
  last_run_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
