import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { RolePermission } from './role-permission.entity';

@Entity('roles', { schema: 'auth' })
export class Role {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ name: 'role_name', type: 'varchar', length: 100, unique: true })
  roleName: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string;

  @OneToMany(() => RolePermission, (rp) => rp.role, { cascade: true, eager: true })
  permissions: RolePermission[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
