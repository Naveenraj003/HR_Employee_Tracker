import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { LeaveType } from './leave-balance.entity';

export enum LeaveRequestStatus {
  APPLIED = 'applied',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  PENDING = 'pending',
}

@Entity('leave_requests', { schema: 'employee' })
export class LeaveRequest {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ name: 'user_id', type: 'bigint' })
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'leave_type', type: 'enum', enum: LeaveType })
  leaveType: LeaveType;

  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date' })
  endDate: Date;

  @Column({ name: 'reason', type: 'text' })
  reason: string;

  @Column({ name: 'status', type: 'enum', enum: LeaveRequestStatus, default: LeaveRequestStatus.APPLIED })
  status: LeaveRequestStatus;

  @Column({ name: 'manager_id', type: 'bigint', nullable: true })
  managerId: number | null;

  @Column({ name: 'manager_remarks', type: 'text', nullable: true })
  managerRemarks: string | null;

  @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
  approvedAt: Date | null;

  @Column({ name: 'rejected_at', type: 'timestamp', nullable: true })
  rejectedAt: Date | null;

  @Column({ name: 'attachment_url', type: 'varchar', length: 500, nullable: true })
  attachmentUrl: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
