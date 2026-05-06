import { Controller, Post, Body, Get, Req, Res, UseGuards, HttpCode, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import {
  LoginRequestDto,
  ChangePasswordDto,
  SetupMfaDto,
  VerifyMfaSetupDto,
  AuthResponseDto,
  RefreshTokenDto,
  CurrentUserResponseDto,
} from './dtos/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'User login with email and password (AUTH-01)' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginRequestDto, @Req() req: Request) {
    const ipAddress = req.ip || req.socket?.remoteAddress || '127.0.0.1';
    const userAgent = req.get('user-agent') || '';

    return this.authService.login(loginDto, ipAddress, userAgent);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'User logout - terminates session (AUTH-04)' })
  async logout(@CurrentUser() user: any, @Req() req: Request) {
    const ipAddress = req.ip || req.socket?.remoteAddress || '127.0.0.1';
    await this.authService.logout(user.sub, ipAddress, req.get('user-agent') || '');
    return { message: 'Logged out successfully' };
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Change password - accessible from profile menu (AUTH-03)' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 401, description: 'Current password is incorrect' })
  async changePassword(
    @CurrentUser() user: any,
    @Body() changePasswordDto: ChangePasswordDto,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket?.remoteAddress || '127.0.0.1';

    if (changePasswordDto.newPassword !== changePasswordDto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    await this.authService.changePassword(user.sub, changePasswordDto, ipAddress);
    return { message: 'Password changed successfully' };
  }

  @Post('mfa/setup')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Setup Multi-Factor Authentication (AUTH-02)' })
  @ApiResponse({ status: 200, description: 'MFA setup initiated' })
  async setupMfa(
    @CurrentUser() user: any,
    @Body() setupDto: SetupMfaDto,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket?.remoteAddress || '127.0.0.1';
    return this.authService.setupMfa(user.sub, setupDto, ipAddress);
  }

  @Post('mfa/verify')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Verify and enable MFA' })
  @ApiResponse({ status: 200, description: 'MFA enabled successfully' })
  async verifyMfaSetup(
    @CurrentUser() user: any,
    @Body() verifyDto: VerifyMfaSetupDto,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket?.remoteAddress || '127.0.0.1';
    return this.authService.verifyMfaSetup(user.sub, verifyDto, ipAddress);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Current user profile', type: CurrentUserResponseDto })
  async getCurrentUser(@CurrentUser() user: any) {
    return this.authService.getCurrentUserProfile(user.sub);
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  async refreshToken(@Body() body: RefreshTokenDto, @Req() req: Request) {
    const ipAddress = req.ip || req.socket?.remoteAddress || '127.0.0.1';
    const userAgent = req.get('user-agent') || '';
    return this.authService.refreshToken(body.refreshToken, ipAddress, userAgent);
  }
}
