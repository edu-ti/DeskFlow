import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('smime_certificates')
export class SmimeCertificate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text' })
  certificate: string;

  @Column({ type: 'text', nullable: true })
  private_key: string;

  @Column({ nullable: true })
  email: string;

  @Column({ unique: true, nullable: true })
  fingerprint: string;

  @Column({ type: 'timestamp', nullable: true })
  expires_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
