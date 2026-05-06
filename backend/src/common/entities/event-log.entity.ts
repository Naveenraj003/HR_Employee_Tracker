import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum EventCategory {
  AUTH = 'AUTH',
  PROFILE = 'PROFILE',
  ATTENDANCE = 'ATTENDANCE',
  LEAVE = 'LEAVE',
  PAYROLL = 'PAYROLL',
  DOCUMENT = 'DOCUMENT',
  HR = 'HR',
  SYSTEM = 'SYSTEM',
}

@Entity('event_log', { schema: 'audit' })
@Index(['category', 'createdAt'])
@Index(['userId', 'createdAt'])
export class EventLog {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ name: 'user_id', type: 'bigint', nullable: true })
  userId: number | null;

  @Column({ name: 'category', type: 'enum', enum: EventCategory, nullable: true })
  category: EventCategory | null;

  @Column({ name: 'event_name', type: 'varchar', length: 255 })
  eventName: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata: any;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
