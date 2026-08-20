import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('cti_logs')
export class CtiLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 'in' })
  direction: string;

  @Column()
  from: string;

  @Column()
  to: string;

  @Column({ nullable: true })
  call_id: string;

  @Column({ default: 'newCall' })
  state: string;

  @Column({ nullable: true })
  queue: string;

  @Column({ type: 'varchar', name: 'caller_name', nullable: true })
  caller_name?: string | null;

  @Column({ type: 'int', name: 'ticket_id', nullable: true })
  ticket_id?: number | null;

  @Column({ type: 'int', nullable: true })
  duration?: number | null;

  @Column({ type: 'text', nullable: true })
  sdp?: string | null;

  @Column({ type: 'int', name: 'user_id', nullable: true })
  user_id?: number | null;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({ default: false })
  done: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
