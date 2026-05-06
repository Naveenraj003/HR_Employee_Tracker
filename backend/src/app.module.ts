import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { User } from './modules/user/entities/user.entity';
import { Role } from './modules/auth/entities/role.entity';
import { Permission } from './modules/auth/entities/permission.entity';
import { RolePermission } from './modules/auth/entities/role-permission.entity';
import { MfaSetup } from './modules/auth/entities/mfa-setup.entity';
import { Session } from './modules/auth/entities/session.entity';
import { PasswordHistory } from './modules/auth/entities/password-history.entity';
import { AuditLog } from './common/entities/audit-log.entity';
import { EventLog } from './common/entities/event-log.entity';
import { EmployeeProfile } from './modules/dashboard/entities/employee-profile.entity';
import { AttendanceRecord } from './modules/dashboard/entities/attendance-record.entity';
import { LeaveBalance } from './modules/dashboard/entities/leave-balance.entity';
import { LeaveRequest } from './modules/dashboard/entities/leave-request.entity';
import { Holiday } from './modules/dashboard/entities/holiday.entity';
import { Notification } from './modules/dashboard/entities/notification.entity';

const getJwtExpiresIn = () => {
  const raw = process.env.JWT_EXPIRATION;
  if (!raw) {
    return '15m' as any;
  }

  // If configured as digits (for example 900), treat as seconds.
  if (/^\d+$/.test(raw)) {
    return parseInt(raw, 10);
  }

  return raw as any;
};

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USER || 'hospital_user',
      password: process.env.DB_PASSWORD || 'hospital_password',
      database: process.env.DB_NAME || 'hospital_tracker_dev',
      entities: [
        User,
        Role,
        Permission,
        RolePermission,
        MfaSetup,
        Session,
        PasswordHistory,
        AuditLog,
        EventLog,
        EmployeeProfile,
        AttendanceRecord,
        LeaveBalance,
        LeaveRequest,
        Holiday,
        Notification,
      ],
      synchronize: process.env.DB_SYNC === 'true' || process.env.NODE_ENV === 'development',
      logging: process.env.DB_LOGGING === 'true',
    }),
    PassportModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: getJwtExpiresIn() },
    }),
    AuthModule,
    UserModule,
    DashboardModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
