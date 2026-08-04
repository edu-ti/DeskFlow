import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from '../../iam/entities/user.entity';
import { Group } from '../../iam/entities/group.entity';
import { Article } from './article.entity';

@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ name: 'group_id' })
  group_id: number;

  @ManyToOne(() => Group)
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @Column({ name: 'state_id' })
  state_id: number;

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

  @OneToMany(() => Article, article => article.ticket)
  articles: Article[];

  @Column({ type: 'timestamp', nullable: true })
  firstResponseEscalationAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  updateEscalationAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  solutionEscalationAt: Date;

  @Column({ default: false })
  isEscalated: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Soft Delete mandatário (BR-HUMANA-001)
  @DeleteDateColumn()
  deleted_at: Date;
}
