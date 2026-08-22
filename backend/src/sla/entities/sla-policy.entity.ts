import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('sla_policies')
export class SlaPolicy {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'varchar', default: 'standard_8_18' })
  calendar_type: string; // 'standard_8_18' | 'extended_8_21'

  @Column({ type: 'int', nullable: true })
  priority_id: number | null;

  @Column({ type: 'int', nullable: true })
  group_id: number | null;

  @Column({ type: 'int', default: 60 })
  first_response_mins: number; // Padrão: 60 mins (1h útil)

  @Column({ type: 'int', default: 240 })
  resolution_mins: number; // Padrão: 240 mins (4h úteis)

  @Column({ type: 'int', default: 480 })
  onsite_resolution_mins: number; // Padrão: 480 mins (8h úteis)

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
