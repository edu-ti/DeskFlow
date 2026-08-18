import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('data_privacy_tasks')
export class DataPrivacyTask {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  deletable_type: string;

  @Column({ type: 'int' })
  deletable_id: number;

  @Column({ default: 'pending' })
  state: string;

  @Column({ name: 'created_by', nullable: true })
  created_by: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
