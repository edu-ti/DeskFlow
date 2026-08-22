import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../iam/entities/user.entity';
import { SlaPolicy } from '../../sla/entities/sla-policy.entity';

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  legal_name: string;

  @Column({ nullable: true })
  cnpj: string;

  @Column({ type: 'varchar', default: 'standard_8_18' })
  calendar_type: string; // 'standard_8_18' | 'extended_8_21'

  @Column({ name: 'sla_policy_id', type: 'int', nullable: true })
  sla_policy_id: number | null;

  @ManyToOne(() => SlaPolicy, { nullable: true })
  @JoinColumn({ name: 'sla_policy_id' })
  sla_policy: SlaPolicy;

  @Column({ nullable: true })
  note: string;

  @Column({ nullable: true })
  domain: string;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;

  @OneToMany(() => User, (user) => user.organization)
  members: User[];
}
