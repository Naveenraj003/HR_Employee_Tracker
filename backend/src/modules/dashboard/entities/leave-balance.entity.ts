import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';

export enum LeaveType {
  PRIVILEGE_LEAVE = 'privilege_leave',
  SICK_LEAVE = 'sick_leave',
  CASUAL_LEAVE = 'casual_leave',
  COMPENSATORY_LEAVE = 'compensatory_leave',
  BEREAVEMENT_LEAVE = 'bereavement_leave',
  OPTIONAL_LEAVE = 'optional_leave',
  PATERNITY_LEAVE = 'paternity_leave',
  WFH = 'wfh',
  ON_DUTY = 'on_duty',
}

@Entity('leave_balances', { schema: 'employee' })
export class LeaveBalance {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ name: 'user_id', type: 'bigint' })
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'leave_type', type: 'enum', enum: LeaveType })
  leaveType: LeaveType;

  @Column({ name: 'financial_year', type: 'varchar', length: 10 })
  financialYear: string;

  @Column({ name: 'total_days', type: 'decimal', precision: 5, scale: 2 })
  totalDays: number;

  @Column({ name: 'used_days', type: 'decimal', precision: 5, scale: 2, default: 0 })
  usedDays: number;

  @Column({ name: 'remaining_days', type: 'decimal', precision: 5, scale: 2 })
  remainingDays: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
