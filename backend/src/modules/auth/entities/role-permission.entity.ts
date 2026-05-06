import {
  Entity,
  ManyToOne,
  PrimaryColumn,
  JoinColumn,
} from 'typeorm';
import { Role } from './role.entity';
import { Permission } from './permission.entity';

@Entity('role_permissions', { schema: 'auth' })
export class RolePermission {
  @PrimaryColumn({ name: 'role_id', type: 'bigint' })
  roleId: number;

  @PrimaryColumn({ name: 'permission_id', type: 'bigint' })
  permissionId: number;

  @ManyToOne(() => Role, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @ManyToOne(() => Permission, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permission_id' })
  permission: Permission;
}
