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

  @Column({ name: 'user_id', nullable: true })
  user_id: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({ default: false })
  done: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
