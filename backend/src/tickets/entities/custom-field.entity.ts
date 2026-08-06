import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('custom_fields')
export class CustomField {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  // e.g. 'text', 'number', 'select'
  @Column()
  type: string;

  // JSON string or simple comma-separated options for 'select'
  @Column({ nullable: true })
  options: string;

  @Column({ default: false })
  is_required: boolean;

  // If null, it applies to all groups
  @Column({ nullable: true })
  group_id: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
