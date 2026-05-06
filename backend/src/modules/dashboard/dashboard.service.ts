import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual, In } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { EmployeeProfile } from './entities/employee-profile.entity';
import { AttendanceRecord } from './entities/attendance-record.entity';
import { LeaveBalance } from './entities/leave-balance.entity';
import { LeaveRequest, LeaveRequestStatus } from './entities/leave-request.entity';
import { Holiday } from './entities/holiday.entity';
import { Notification } from './entities/notification.entity';
import { Role } from '../auth/entities/role.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(EmployeeProfile)
    private readonly employeeProfileRepository: Repository<EmployeeProfile>,
    @InjectRepository(AttendanceRecord)
    private readonly attendanceRecordRepository: Repository<AttendanceRecord>,
    @InjectRepository(LeaveBalance)
    private readonly leaveBalanceRepository: Repository<LeaveBalance>,
    @InjectRepository(LeaveRequest)
    private readonly leaveRequestRepository: Repository<LeaveRequest>,
    @InjectRepository(Holiday)
    private readonly holidayRepository: Repository<Holiday>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  /**
   * Get complete dashboard data for the logged-in employee
   */
  async getDashboardData(userId: number) {
    const [
      headerData,
      attendanceSummary,
      leaveSummary,
      recentLeaveRequests,
      teamLeaves,
      celebrations,
      holidays,
      notifications,
    ] = await Promise.all([
      this.getHeaderData(userId),
      this.getAttendanceSummary(userId),
      this.getLeaveSummary(userId),
      this.getRecentLeaveRequests(userId),
      this.getTeamLeaves(userId),
      this.getCelebrations(userId),
      this.getHolidaysData(),
      this.getRecentNotifications(userId),
    ]);

    return {
      header: headerData,
      attendance: attendanceSummary,
      leave: leaveSummary,
      recentLeaveRequests,
      teamLeaves,
      celebrations,
      holidays,
      notifications,
    };
  }

  /**
   * Get header data: profile picture, employee code, role, location, date/time, notifications
   */
  async getHeaderData(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['role'],
    });

    const profile = await this.employeeProfileRepository.findOne({
      where: { userId },
    });

    const unreadNotifications = await this.notificationRepository.count({
      where: { userId, read: false },
    });

    return {
      profilePicture: profile?.profilePictureUrl || null,
      employeeCode: user?.employeeCode || '',
      fullName: user?.fullName || '',
      role: user?.role?.roleName || '',
      workLocation: profile?.workLocation || 'N/A',
      reportingManager: profile?.reportingManagerId ? await this.getUserName(profile.reportingManagerId) : 'N/A',
      currentDate: new Date(),
      unreadNotificationsCount: unreadNotifications,
    };
  }

  /**
   * Get attendance summary: check-in/out, working hours, 30-day stats
   */
  async getAttendanceSummary(userId: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayAttendance = await this.attendanceRecordRepository.findOne({
      where: { userId, attendanceDate: today },
    });

    // Get last 30 days attendance for stats
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const last30Days = await this.attendanceRecordRepository.find({
      where: {
        userId,
        attendanceDate: Between(thirtyDaysAgo, today),
      },
    });

    const totalWorkingDays = last30Days.filter((a) => a.status === 'present').length;
    const totalWorkingHours = last30Days.reduce(
      (sum, a) => sum + Number(a.workingHours || 0),
      0,
    );
    const averageHoursPerDay = totalWorkingDays > 0 ? (totalWorkingHours / totalWorkingDays).toFixed(2) : '0.00';

    return {
      todayCheckIn: todayAttendance?.checkInTime || null,
      todayCheckOut: todayAttendance?.checkOutTime || null,
      todayWorkingHours: todayAttendance?.workingHours || null,
      monthWorkingDays: totalWorkingDays,
      monthTotalHours: totalWorkingHours.toFixed(2),
      monthAverageHours: averageHoursPerDay,
      last30Days: last30Days.map((a) => ({
        date: a.attendanceDate,
        status: a.status,
        workingHours: a.workingHours,
      })),
    };
  }

  async checkIn(userId: number) {
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let attendance = await this.attendanceRecordRepository.findOne({
      where: { userId, attendanceDate: today },
    });

    if (!attendance) {
      attendance = this.attendanceRecordRepository.create({
        userId,
        attendanceDate: today,
        checkInTime: now,
        checkOutTime: null,
        status: 'present',
        workingHours: null,
        shiftCode: 'GENERAL',
      });
    } else {
      attendance.checkInTime = attendance.checkInTime || now;
      attendance.status = 'present';
    }

    await this.attendanceRecordRepository.save(attendance);
    return { success: true, checkInTime: attendance.checkInTime };
  }

  async checkOut(userId: number) {
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await this.attendanceRecordRepository.findOne({
      where: { userId, attendanceDate: today },
    });

    if (!attendance || !attendance.checkInTime) {
      return { success: false, message: 'Check-in not found for today' };
    }

    attendance.checkOutTime = now;
    const millis = now.getTime() - new Date(attendance.checkInTime).getTime();
    const hours = Math.max(0, millis / (1000 * 60 * 60));
    attendance.workingHours = Number(hours.toFixed(2));
    attendance.status = 'present';

    await this.attendanceRecordRepository.save(attendance);
    return { success: true, checkOutTime: attendance.checkOutTime, workingHours: attendance.workingHours };
  }

  /**
   * Get leave balance summary: all leave types with remaining days
   */
  async getLeaveSummary(userId: number) {
    const currentFY = this.getCurrentFinancialYear();

    const leaveBalances = await this.leaveBalanceRepository.find({
      where: { userId, financialYear: currentFY },
    });

    const balanceMap: Record<string, any> = {};
    leaveBalances.forEach((balance) => {
      balanceMap[balance.leaveType] = {
        totalDays: balance.totalDays,
        usedDays: balance.usedDays,
        remainingDays: balance.remainingDays,
      };
    });

    return balanceMap;
  }

  /**
   * Get recent leave requests for the employee (for Team Leave widget)
   */
  async getRecentLeaveRequests(userId: number) {
    const requests = await this.leaveRequestRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 5,
    });

    return requests.map((req) => ({
      id: req.id,
      leaveType: req.leaveType,
      startDate: req.startDate,
      endDate: req.endDate,
      status: req.status,
      createdAt: req.createdAt,
    }));
  }

  /**
   * Get team leaves: other team members on leave
   */
  async getTeamLeaves(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find team members (employees under same manager)
    const team = await this.employeeProfileRepository.find({
      where: { reportingManagerId: userId },
      relations: ['user'],
    });

    const teamUserIds = team.map((t) => t.userId);

    // Find approved leaves for team members today
    if (teamUserIds.length === 0) return [];

    const teamLeaves = await this.leaveRequestRepository.find({
      where: {
        userId: In(teamUserIds),
        status: LeaveRequestStatus.APPROVED,
        startDate: LessThanOrEqual(today),
        endDate: MoreThanOrEqual(today),
      },
      relations: ['user'],
    });

    return teamLeaves.map((leave) => ({
      employeeName: leave.user?.fullName || '',
      leaveType: leave.leaveType,
      startDate: leave.startDate,
      endDate: leave.endDate,
    }));
  }

  /**
   * Get celebrations: birthdays and work anniversaries
   */
  async getCelebrations(userId: number) {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();

    // Get all employees with birthdays/anniversaries this month
    const allProfiles = await this.employeeProfileRepository.find({ relations: ['user'] });

    const birthdays = allProfiles
      .filter((p) => {
        if (!p.dateOfBirth) return false;
        const dob = new Date(p.dateOfBirth);
        return dob.getMonth() + 1 === currentMonth && dob.getDate() === currentDay;
      })
      .map((p) => ({
        userName: p.user?.fullName || '',
        celebrationType: 'birthday',
        date: p.dateOfBirth,
      }));

    const anniversaries = allProfiles
      .filter((p) => {
        if (!p.dateOfJoining) return false;
        const doj = new Date(p.dateOfJoining);
        return doj.getMonth() + 1 === currentMonth && doj.getDate() === currentDay;
      })
      .map((p) => ({
        userName: p.user?.fullName || '',
        celebrationType: 'anniversary',
        date: p.dateOfJoining,
      }));

    return [...birthdays, ...anniversaries];
  }

  /**
   * Get holidays for current year
   */
  async getHolidaysData() {
    const currentYear = new Date().getFullYear();
    const startDate = new Date(currentYear, 0, 1);
    const endDate = new Date(currentYear, 11, 31);

    const holidays = await this.holidayRepository.find({
      where: {
        holidayDate: Between(startDate, endDate),
      },
      order: { holidayDate: 'ASC' },
    });

    const holidaysByMonth: Record<string, any[]> = {};
    holidays.forEach((holiday) => {
      const month = holiday.holidayDate.toLocaleString('default', { month: 'long' });
      if (!holidaysByMonth[month]) {
        holidaysByMonth[month] = [];
      }
      holidaysByMonth[month].push({
        date: holiday.holidayDate,
        name: holiday.holidayName,
        description: holiday.description,
      });
    });

    return holidaysByMonth;
  }

  /**
   * Get recent notifications
   */
  async getRecentNotifications(userId: number, limit = 5) {
    const notifications = await this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });

    return notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      read: n.read,
      createdAt: n.createdAt,
    }));
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: number) {
    await this.notificationRepository.update(notificationId, { read: true });
  }

  /**
   * Get quick-access tile options (for frontend to display configurability)
   */
  getQuickAccessTileOptions() {
    return [
      { id: 'apply_leave', label: 'Apply Leave', icon: 'calendar' },
      { id: 'view_attendance', label: 'View Attendance', icon: 'clock' },
      { id: 'payment_history', label: 'Payment History', icon: 'receipt' },
      { id: 'my_documents', label: 'My Documents', icon: 'document' },
    ];
  }

  /**
   * Get configured tiles for an employee (or return default)
   */
  async getQuickAccessTiles(userId: number) {
    // Check if user has configured tiles preference
    // For now, return all available tiles (frontend will display up to 3 configurable)
    const options = this.getQuickAccessTileOptions();
    return options;
  }

  /**
   * Save user's quick-access tile preferences
   * Note: In a real implementation, this would be stored in a user_preferences table
   * For now, we return success and frontend can manage state locally
   */
  async saveQuickAccessTilePreferences(userId: number, selectedTiles: string[]) {
    // Validate: max 3 tiles allowed
    if (selectedTiles.length > 3) {
      throw new Error('Maximum 3 tiles can be selected');
    }
    // Validate: all tiles must be valid
    const validIds = this.getQuickAccessTileOptions().map(t => t.id);
    const allValid = selectedTiles.every(id => validIds.includes(id));
    if (!allValid) {
      throw new Error('Invalid tile selection');
    }
    // TODO: Store preferences in database
    return { success: true, selectedTiles };
  }

  /**
   * Helper: Get user name by ID
   */
  private async getUserName(userId: number): Promise<string> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    return user?.fullName || 'N/A';
  }

  /**
   * Helper: Get current financial year (April - March)
   */
  private getCurrentFinancialYear(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;

    if (month >= 4) {
      return `${year}-${year + 1}`;
    } else {
      return `${year - 1}-${year}`;
    }
  }
}
