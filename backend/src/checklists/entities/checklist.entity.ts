import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Ticket } from '../../tickets/entities/ticket.entity';
import { ChecklistItem } from './checklist-item.entity';

@Entity('checklists')
export class Checklist {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'ticket_id' })
  ticket_id: number;

  @ManyToOne(() => Ticket)
  @JoinColumn({ name: 'ticket_id' })
  ticket: Ticket;

  @Column({ nullable: true })
  name: string;

  @OneToMany(() => ChecklistItem, (item) => item.checklist, { cascade: true })
  items: ChecklistItem[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
