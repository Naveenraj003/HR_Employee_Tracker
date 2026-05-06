import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Role } from '../../auth/entities/role.entity';
import { MfaSetup } from '../../auth/entities/mfa-setup.entity';
import { Session } from '../../auth/entities/session.entity';
import { PasswordHistory } from '../../auth/entities/password-history.entity';

export enum AccountStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
}

@Entity('users', { schema: 'employee' })
export class User {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ name: 'employee_code', type: 'varchar', length: 20, unique: true })
  employeeCode: string;

  @Column({ name: 'email', type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  @Exclude()
  passwordHash: string;

  @Column({ name: 'full_name', type: 'varchar', length: 255 })
  fullName: string;

  @Column({ name: 'account_status', type: 'enum', enum: AccountStatus, default: AccountStatus.PENDING })
  accountStatus: AccountStatus;

  @Column({ name: 'login_attempts', type: 'int', default: 0 })
  loginAttempts: number;

  @Column({ name: 'locked_until', type: 'timestamp', nullable: true })
  lockedUntil: Date | null;

  @Column({ name: 'last_login', type: 'timestamp', nullable: true })
  lastLogin: Date | null;

  @Column({ name: 'role_id', type: 'bigint' })
  roleId: number;

  @ManyToOne(() => Role, { eager: true })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @OneToMany(() => MfaSetup, (mfa) => mfa.user, { cascade: true })
  mfaSetups: MfaSetup[];

  @OneToMany(() => Session, (session) => session.user, { cascade: true })
  sessions: Session[];

  @OneToMany(() => PasswordHistory, (ph) => ph.user, { cascade: true })
  passwordHistory: PasswordHistory[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
