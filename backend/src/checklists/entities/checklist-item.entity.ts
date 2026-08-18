import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Checklist } from './checklist.entity';

@Entity('checklist_items')
export class ChecklistItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'checklist_id' })
  checklist_id: number;

  @ManyToOne(() => Checklist, (checklist) => checklist.items)
  @JoinColumn({ name: 'checklist_id' })
  checklist: Checklist;

  @Column()
  text: string;

  @Column({ default: false })
  done: boolean;

  @Column({ default: 0 })
  position: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
