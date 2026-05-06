import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';

export enum NotificationType {
  PAYSLIP = 'payslip',
  LEAVE_APPROVAL = 'leave_approval',
  LEAVE_REJECTION = 'leave_rejection',
  SYSTEM_ALERT = 'system_alert',
  BIRTHDAY = 'birthday',
  ANNIVERSARY = 'anniversary',
}

@Entity('notifications', { schema: 'employee' })
export class Notification {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ name: 'user_id', type: 'bigint' })
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'type', type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column({ name: 'title', type: 'varchar', length: 255 })
  title: string;

  @Column({ name: 'message', type: 'text' })
  message: string;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @Column({ name: 'read', type: 'boolean', default: false })
  read: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
