import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('postmaster_filters')
export class PostmasterFilter {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ default: 'email' })
  channel: string;

  @Column({ type: 'jsonb', nullable: true })
  match: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  perform: Record<string, any>;

  @Column({ default: 0 })
  prio: number;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
