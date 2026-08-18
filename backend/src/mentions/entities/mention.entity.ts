import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Ticket } from '../../tickets/entities/ticket.entity';
import { User } from '../../iam/entities/user.entity';

@Entity('mentions')
export class Mention {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'ticket_id' })
  ticket_id: number;

  @ManyToOne(() => Ticket)
  @JoinColumn({ name: 'ticket_id' })
  ticket: Ticket;

  @Column({ name: 'article_id', nullable: true })
  article_id: number;

  @Column({ name: 'user_id' })
  user_id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'created_by_id', nullable: true })
  created_by_id: number;

  @CreateDateColumn()
  created_at: Date;
}
