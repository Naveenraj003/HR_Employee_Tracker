import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum OperationType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  MFA_SETUP = 'MFA_SETUP',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
}

@Entity('audit_log', { schema: 'audit' })
@Index(['userId', 'createdAt'])
@Index(['entityType', 'entityId', 'createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ name: 'user_id', type: 'bigint', nullable: true })
  userId: number | null;

  @Column({ name: 'entity_type', type: 'varchar', length: 100 })
  entityType: string;

  @Column({ name: 'entity_id', type: 'bigint', nullable: true })
  entityId: number | null;

  @Column({ name: 'operation', type: 'enum', enum: OperationType, nullable: true })
  operation: OperationType | null;

  @Column({ name: 'old_values', type: 'jsonb', nullable: true })
  oldValues: any | null;

  @Column({ name: 'new_values', type: 'jsonb', nullable: true })
  newValues: any | null;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string | null;

  @Column({ name: 'status', type: 'varchar', length: 20, nullable: true })
  status: string | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
