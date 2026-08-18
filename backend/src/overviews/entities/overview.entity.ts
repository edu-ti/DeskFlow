import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';

@Entity('overviews')
export class Overview {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ type: 'jsonb', nullable: true })
  condition: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  columns: string[];

  @Column({ default: 'created_at' })
  order_by: string;

  @Column({ default: 'desc' })
  order_direction: string;

  @Column({ type: 'simple-array', nullable: true })
  roles: string[];

  @Column({ default: 0 })
  prio: number;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;
}
