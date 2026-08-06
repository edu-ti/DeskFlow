import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Ticket } from './ticket.entity';
import { User } from '../../iam/entities/user.entity';

@Entity('ticket_history')
export class TicketHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Ticket, (ticket) => ticket.history, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ticket_id' })
  ticket: Ticket;

  @Column({ name: 'ticket_id' })
  ticket_id: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', nullable: true })
  user_id: number;

  @Column({ length: 50 })
  field: string; // e.g., 'state_id', 'owner_id'

  @Column({ nullable: true })
  old_value: string;

  @Column({ nullable: true })
  new_value: string;

  @CreateDateColumn()
  created_at: Date;
}
