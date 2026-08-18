import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ChatSession } from './chat-session.entity';

@Entity('chat_messages')
export class ChatMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'session_id' })
  session_id: number;

  @ManyToOne(() => ChatSession, (session) => session.messages)
  @JoinColumn({ name: 'session_id' })
  session: ChatSession;

  @Column({ type: 'text' })
  content: string;

  @Column({ default: true })
  from_customer: boolean;

  @CreateDateColumn()
  created_at: Date;
}
