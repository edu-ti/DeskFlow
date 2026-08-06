import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Ticket } from './ticket.entity';
import { CustomField } from './custom-field.entity';

@Entity('ticket_custom_field_values')
export class TicketCustomFieldValue {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  ticket_id: number;

  @Column()
  custom_field_id: number;

  @Column('text')
  value: string;

  @ManyToOne(() => Ticket, ticket => ticket.custom_field_values, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ticket_id' })
  ticket: Ticket;

  @ManyToOne(() => CustomField, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'custom_field_id' })
  custom_field: CustomField;

  @CreateDateColumn()
  created_at: Date;
}
