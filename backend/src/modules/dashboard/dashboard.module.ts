import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { User } from '../user/entities/user.entity';
import { Role } from '../auth/entities/role.entity';
import { EmployeeProfile } from './entities/employee-profile.entity';
import { AttendanceRecord } from './entities/attendance-record.entity';
import { LeaveBalance } from './entities/leave-balance.entity';
import { LeaveRequest } from './entities/leave-request.entity';
import { Holiday } from './entities/holiday.entity';
import { Notification } from './entities/notification.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Role,
      EmployeeProfile,
      AttendanceRecord,
      LeaveBalance,
      LeaveRequest,
      Holiday,
      Notification,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
