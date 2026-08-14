import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Ticket } from './ticket.entity';
import { User } from '../../iam/entities/user.entity';

@Entity('ticket_links')
export class TicketLink {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'source_ticket_id' })
  source_ticket_id: number;

  @ManyToOne(() => Ticket)
  @JoinColumn({ name: 'source_ticket_id' })
  source_ticket: Ticket;

  @Column({ name: 'target_ticket_id' })
  target_ticket_id: number;

  @ManyToOne(() => Ticket)
  @JoinColumn({ name: 'target_ticket_id' })
  target_ticket: Ticket;

  @Column({ name: 'created_by_id' })
  created_by_id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by_id' })
  created_by: User;

  @CreateDateColumn()
  created_at: Date;
}
