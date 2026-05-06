import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Role } from '../../modules/auth/entities/role.entity';
import { User, AccountStatus } from '../../modules/user/entities/user.entity';
import { EmployeeProfile } from '../../modules/dashboard/entities/employee-profile.entity';
import { AttendanceRecord } from '../../modules/dashboard/entities/attendance-record.entity';
import { LeaveBalance, LeaveType } from '../../modules/dashboard/entities/leave-balance.entity';
import { Holiday } from '../../modules/dashboard/entities/holiday.entity';

async function seed() {
  const app = await NestFactory.create(AppModule);
  await app.init();

  const dataSource = app.get(DataSource);

  try {
    console.log('🌱 Starting seed process...');

    // Get the EMPLOYEE role
    const employeeRole = await dataSource.getRepository(Role).findOne({
      where: { roleName: 'EMPLOYEE' },
    });

    if (!employeeRole) {
      console.error('❌ EMPLOYEE role not found. Please ensure roles are seeded from init-db.sql');
      await app.close();
      process.exit(1);
    }

    // Check if demo user already exists
    let demoUser = await dataSource.getRepository(User).findOne({
      where: { email: 'demo@example.com' },
    });

    if (!demoUser) {
      console.log('Creating demo user...');
      const passwordHash = await bcrypt.hash('password123', 10);
      demoUser = dataSource.getRepository(User).create({
        employeeCode: 'EMP001',
        email: 'demo@example.com',
        passwordHash,
        fullName: 'John Doe',
        role: employeeRole,
        accountStatus: AccountStatus.ACTIVE,
      });
      demoUser = await dataSource.getRepository(User).save(demoUser);
      console.log('✅ Demo user created');
    }

    // Create employee profile
    let profile = await dataSource.getRepository(EmployeeProfile).findOne({
      where: { userId: demoUser.id },
    });

    if (!profile) {
      console.log('Creating demo employee profile...');
      const dateOfJoining = new Date('2023-01-15');
      const dateOfBirth = new Date('1990-05-20');

      profile = dataSource.getRepository(EmployeeProfile).create({
        userId: demoUser.id,
        dateOfBirth,
        designation: 'Senior Software Engineer',
        workLocation: 'Mumbai Office',
        reportingManagerId: null, // Can be set later
        dateOfJoining,
        profilePictureUrl: 'https://i.pravatar.cc/150?img=1',
        mobileNumber: '+91-9876543210',
      });
      profile = await dataSource.getRepository(EmployeeProfile).save(profile);
      console.log('✅ Employee profile created');
    }

    // Seed attendance records for the last 30 days
    const existingAttendance = await dataSource.getRepository(AttendanceRecord).count({
      where: { userId: demoUser.id },
    });

    if (existingAttendance === 0) {
      console.log('Creating attendance records for last 30 days...');
      const today = new Date();
      const attendanceRecords = [];

      for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dayOfWeek = date.getDay();

        let status: 'present' | 'absent' | 'week_off' | 'holiday' | 'on_leave' = 'present';
        let checkInTime = null;
        let checkOutTime = null;
        let workingHours = null;

        // Simulate weekends and varied attendance
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          status = 'week_off';
        } else if (i % 15 === 0) {
          status = 'absent';
        } else {
          status = 'present';
          checkInTime = new Date(date);
          checkInTime.setHours(9, 0, 0, 0);
          checkOutTime = new Date(date);
          checkOutTime.setHours(18, 0, 0, 0);
          workingHours = 9;
        }

        attendanceRecords.push(
          dataSource.getRepository(AttendanceRecord).create({
            userId: demoUser.id,
            attendanceDate: date,
            checkInTime,
            checkOutTime,
            status,
            workingHours,
            shiftCode: 'GENERAL',
          }),
        );
      }

      await dataSource.getRepository(AttendanceRecord).save(attendanceRecords);
      console.log('✅ Attendance records created');
    }

    // Seed leave balances for current financial year
    const currentFY = new Date().getMonth() >= 3 ? `${new Date().getFullYear()}-${new Date().getFullYear() + 1}` : `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`;

    const existingLeaveBalance = await dataSource.getRepository(LeaveBalance).count({
      where: { userId: demoUser.id, financialYear: currentFY },
    });

    if (existingLeaveBalance === 0) {
      console.log('Creating leave balances...');
      const leaveTypes: { type: LeaveType; total: number; used: number }[] = [
        { type: LeaveType.PRIVILEGE_LEAVE, total: 20, used: 5 },
        { type: LeaveType.SICK_LEAVE, total: 10, used: 2 },
        { type: LeaveType.CASUAL_LEAVE, total: 8, used: 1 },
        { type: LeaveType.COMPENSATORY_LEAVE, total: 5, used: 0 },
        { type: LeaveType.BEREAVEMENT_LEAVE, total: 3, used: 0 },
        { type: LeaveType.OPTIONAL_LEAVE, total: 2, used: 0 },
        { type: LeaveType.PATERNITY_LEAVE, total: 0, used: 0 },
        { type: LeaveType.WFH, total: 10, used: 3 },
        { type: LeaveType.ON_DUTY, total: 5, used: 1 },
      ];

      const leaveBalances = leaveTypes.map((leave) =>
        dataSource.getRepository(LeaveBalance).create({
          userId: demoUser.id,
          leaveType: leave.type,
          financialYear: currentFY,
          totalDays: leave.total,
          usedDays: leave.used,
          remainingDays: leave.total - leave.used,
        }),
      );

      await dataSource.getRepository(LeaveBalance).save(leaveBalances);
      console.log('✅ Leave balances created');
    }

    // Seed holidays for current year
    const existingHolidays = await dataSource.getRepository(Holiday).count();

    if (existingHolidays === 0) {
      console.log('Creating holidays...');
      const year = new Date().getFullYear();
      const holidays = [
        { name: 'New Year\'s Day', date: new Date(year, 0, 1), description: 'National Holiday' },
        { name: 'Republic Day', date: new Date(year, 0, 26), description: 'National Holiday' },
        { name: 'Holi', date: new Date(year, 2, 25), description: 'Festival Holiday' },
        { name: 'Good Friday', date: new Date(year, 3, 7), description: 'National Holiday' },
        { name: 'Eid ul-Fitr', date: new Date(year, 3, 30), description: 'Festival Holiday', optional: true },
        { name: 'Labour Day', date: new Date(year, 4, 1), description: 'National Holiday' },
        { name: 'Independence Day', date: new Date(year, 7, 15), description: 'National Holiday' },
        { name: 'Janmashtami', date: new Date(year, 8, 16), description: 'Festival Holiday' },
        { name: 'Ganesh Chaturthi', date: new Date(year, 8, 19), description: 'Festival Holiday' },
        { name: 'Gandhi Jayanti', date: new Date(year, 9, 2), description: 'National Holiday' },
        { name: 'Diwali', date: new Date(year, 10, 1), description: 'Festival Holiday' },
        { name: 'Christmas', date: new Date(year, 11, 25), description: 'National Holiday' },
      ];

      const holidayEntities = holidays.map((h) =>
        dataSource.getRepository(Holiday).create({
          holidayName: h.name,
          holidayDate: h.date,
          description: h.description,
          isOptional: h.optional || false,
        }),
      );

      await dataSource.getRepository(Holiday).save(holidayEntities);
      console.log('✅ Holidays created');
    }

    console.log('✅ Seed completed successfully');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

seed().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
