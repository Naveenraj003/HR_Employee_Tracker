import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity('employee_profiles', { schema: 'employee' })
export class EmployeeProfile {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ name: 'user_id', type: 'bigint', unique: true })
  userId: number;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth: Date | null;

  @Column({ name: 'designation', type: 'varchar', length: 255, nullable: true })
  designation: string | null;

  @Column({ name: 'work_location', type: 'varchar', length: 255, nullable: true })
  workLocation: string | null;

  @Column({ name: 'reporting_manager_id', type: 'bigint', nullable: true })
  reportingManagerId: number | null;

  @Column({ name: 'date_of_joining', type: 'date', nullable: true })
  dateOfJoining: Date | null;

  @Column({ name: 'profile_picture_url', type: 'varchar', length: 500, nullable: true })
  profilePictureUrl: string | null;

  @Column({ name: 'mobile_number', type: 'varchar', length: 20, nullable: true })
  mobileNumber: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
