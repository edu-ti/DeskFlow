import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from '../../iam/entities/user.entity';
import { Group } from '../../iam/entities/group.entity';
import { Article } from './article.entity';
import { TicketHistory } from './ticket-history.entity';
import { TicketCustomFieldValue } from './ticket-custom-field-value.entity';

@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  // web, email, whatsapp
  @Column({ default: 'web' })
  source: string;

  @Column({ name: 'group_id' })
  group_id: number;

  @ManyToOne(() => Group)
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @Column({ name: 'state_id' })
  state_id: number;

  @Column({ name: 'priority_id', default: 2 })
  priority_id: number;

  @Column({ name: 'customer_id' })
  customer_id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'customer_id' })
  customer: User;

  @Column({ name: 'owner_id', nullable: true })
  owner_id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column({ name: 'parent_id', nullable: true })
  parent_id: number;

  @ManyToOne(() => Ticket, (ticket: any) => ticket.sub_tickets)
  @JoinColumn({ name: 'parent_id' })
  parent: Ticket;

  @OneToMany(() => Ticket, (ticket: any) => ticket.parent)
  sub_tickets: Ticket[];

  @OneToMany(() => Article, article => article.ticket)
  articles: Article[];

  @OneToMany(() => TicketHistory, history => history.ticket)
  history: TicketHistory[];

  @OneToMany(() => TicketCustomFieldValue, customValue => customValue.ticket)
  custom_field_values: TicketCustomFieldValue[];

  @Column({ type: 'timestamp', nullable: true })
  firstResponseEscalationAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  updateEscalationAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  solutionEscalationAt: Date;

  @Column({ default: false })
  isEscalated: boolean;

  @Column({ type: 'int', nullable: true })
  satisfaction_score: number;

  @Column({ type: 'text', nullable: true })
  satisfaction_comment: string;

  @Column({ type: 'varchar', nullable: true, unique: true })
  csat_token: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Soft Delete mandatário (BR-HUMANA-001)
  @DeleteDateColumn()
  deleted_at: Date;
}
