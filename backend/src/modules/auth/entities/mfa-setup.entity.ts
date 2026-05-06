import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { User } from '../../user/entities/user.entity';

export enum MfaMethod {
  TOTP = 'totp',
  SMS = 'sms',
  EMAIL = 'email',
  BACKUP_CODES = 'backup_codes',
}

@Entity('mfa_setup', { schema: 'auth' })
@Unique(['userId'])
export class MfaSetup {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ name: 'user_id', type: 'bigint' })
  userId: number;

  @ManyToOne(() => User, (user) => user.mfaSetups, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'mfa_method', type: 'enum', enum: MfaMethod })
  mfaMethod: MfaMethod;

  @Column({ name: 'secret', type: 'varchar', length: 255 })
  @Exclude()
  secret: string;

  @Column({ name: 'is_enabled', type: 'boolean', default: false })
  isEnabled: boolean;

  @Column({ name: 'backup_codes', type: 'text', array: true, nullable: true })
  @Exclude()
  backupCodes: string[] | null;

  @Column({ name: 'verified_at', type: 'timestamp', nullable: true })
  verifiedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
