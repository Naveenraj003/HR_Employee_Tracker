import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity('attendance_records', { schema: 'employee' })
export class AttendanceRecord {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ name: 'user_id', type: 'bigint' })
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'attendance_date', type: 'date' })
  attendanceDate: Date;

  @Column({ name: 'check_in_time', type: 'timestamp', nullable: true })
  checkInTime: Date | null;

  @Column({ name: 'check_out_time', type: 'timestamp', nullable: true })
  checkOutTime: Date | null;

  @Column({ name: 'status', type: 'varchar', length: 50 })
  status: 'present' | 'absent' | 'week_off' | 'holiday' | 'on_leave';

  @Column({ name: 'working_hours', type: 'decimal', precision: 5, scale: 2, nullable: true })
  workingHours: number | null;

  @Column({ name: 'shift_code', type: 'varchar', length: 20, nullable: true })
  shiftCode: string | null;

  @Column({ name: 'remarks', type: 'text', nullable: true })
  remarks: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
