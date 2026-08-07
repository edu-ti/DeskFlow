import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export interface MacroAction {
  field: string; // 'state_id', 'group_id', 'article'
  value: any; // e.g. 4 for state_id (Closed), or { body: "...", is_internal: false } for article
}

@Entity('macros')
export class Macro {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'jsonb', default: [] })
  actions: MacroAction[];

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
