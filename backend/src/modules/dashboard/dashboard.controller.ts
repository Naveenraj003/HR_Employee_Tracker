import { Controller, Get, Post, Param, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Dashboard')
@Controller('api/dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Get complete dashboard data for logged-in employee' })
  async getDashboard(@CurrentUser() user: any) {
    return this.dashboardService.getDashboardData(user.id);
  }

  @Get('header')
  @ApiOperation({ summary: 'Get header data: profile, role, location, notifications' })
  async getHeaderData(@CurrentUser() user: any) {
    return this.dashboardService.getHeaderData(user.id);
  }

  @Get('attendance-summary')
  @ApiOperation({ summary: 'Get attendance summary: check-in/out, working hours, 30-day stats' })
  async getAttendanceSummary(@CurrentUser() user: any) {
    return this.dashboardService.getAttendanceSummary(user.id);
  }

  @Post('attendance/check-in')
  @ApiOperation({ summary: 'Check in for today' })
  async checkIn(@CurrentUser() user: any) {
    return this.dashboardService.checkIn(user.id);
  }

  @Post('attendance/check-out')
  @ApiOperation({ summary: 'Check out for today' })
  async checkOut(@CurrentUser() user: any) {
    return this.dashboardService.checkOut(user.id);
  }

  @Get('leave-summary')
  @ApiOperation({ summary: 'Get leave balance summary for all leave types' })
  async getLeaveSummary(@CurrentUser() user: any) {
    return this.dashboardService.getLeaveSummary(user.id);
  }

  @Get('team-leaves')
  @ApiOperation({ summary: 'Get team members on leave' })
  async getTeamLeaves(@CurrentUser() user: any) {
    return this.dashboardService.getTeamLeaves(user.id);
  }

  @Get('celebrations')
  @ApiOperation({ summary: 'Get upcoming birthdays and work anniversaries' })
  async getCelebrations(@CurrentUser() user: any) {
    return this.dashboardService.getCelebrations(user.id);
  }

  @Get('holidays')
  @ApiOperation({ summary: 'Get holidays for current year organized by month' })
  async getHolidays() {
    return this.dashboardService.getHolidaysData();
  }

  @Get('notifications')
  @ApiOperation({ summary: 'Get recent notifications for the employee' })
  async getNotifications(@CurrentUser() user: any) {
    return this.dashboardService.getRecentNotifications(user.id);
  }

  @Post('notifications/:id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  async markNotificationAsRead(@Param('id') notificationId: number) {
    await this.dashboardService.markNotificationAsRead(notificationId);
    return { success: true };
  }

  @Get('quick-access-tiles')
  @ApiOperation({ summary: 'Get quick-access tile options' })
  async getQuickAccessTiles(@CurrentUser() user: any) {
    return this.dashboardService.getQuickAccessTiles(user.id);
  }

  @Get('recent-leave-requests')
  @ApiOperation({ summary: 'Get recent leave requests' })
  async getRecentLeaveRequests(@CurrentUser() user: any) {
    return this.dashboardService.getRecentLeaveRequests(user.id);
  }
}
