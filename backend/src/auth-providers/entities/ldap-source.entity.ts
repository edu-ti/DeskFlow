import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';

@Entity('ldap_sources')
export class LdapSource {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ default: 'localhost' })
  host: string;

  @Column({ type: 'int', default: 389 })
  port: number;

  @Column({ nullable: true })
  base_dn: string;

  @Column({ nullable: true })
  bind_user: string;

  @Column({ nullable: true })
  bind_password: string;

  @Column({ default: false })
  ssl: boolean;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;
}
