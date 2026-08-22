import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Device } from './device.entity';
import { Ticket } from '../../tickets/entities/ticket.entity';

@Entity('device_alerts')
export class DeviceAlert {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'device_id' })
  device_id: number;

  @ManyToOne(() => Device, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'device_id' })
  device: Device;

  @Column()
  alert_type: string; // 'high_cpu' | 'high_ram' | 'disk_full' | 'offline'

  @Column({ default: 'warning' })
  severity: 'warning' | 'critical';

  @Column({ type: 'text' })
  message: string;

  @Column({ name: 'ticket_id', nullable: true })
  ticket_id: number | null;

  @ManyToOne(() => Ticket, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'ticket_id' })
  ticket: Ticket;

  @Column({ default: false })
  is_resolved: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
