import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThan, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import { User } from '../user/entities/user.entity';
import { Session } from './entities/session.entity';
import { MfaSetup, MfaMethod } from './entities/mfa-setup.entity';
import { PasswordHistory } from './entities/password-history.entity';
import { AuditLog, OperationType } from '../../common/entities/audit-log.entity';
import { EventLog, EventCategory } from '../../common/entities/event-log.entity';
import {
  LoginRequestDto,
  ChangePasswordDto,
  SetupMfaDto,
  VerifyMfaSetupDto,
} from './dtos/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
    @InjectRepository(MfaSetup)
    private mfaSetupRepository: Repository<MfaSetup>,
    @InjectRepository(PasswordHistory)
    private passwordHistoryRepository: Repository<PasswordHistory>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
    @InjectRepository(EventLog)
    private eventLogRepository: Repository<EventLog>,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginRequestDto, ipAddress: string, userAgent: string) {
    const loginIdentifier = (loginDto.loginId || loginDto.email || loginDto.username || '').trim();
    if (!loginIdentifier) {
      throw new BadRequestException('Email or username is required');
    }

    const user = await this.userRepository.findOne({
      where: [
        { email: loginIdentifier.toLowerCase() },
        { employeeCode: loginIdentifier.toUpperCase() },
      ],
      relations: ['role', 'role.permissions'],
    });

    if (!user) {
      await this.logAuditEvent(null, 'User', null, OperationType.LOGIN, null, null, 'failure', 'Invalid credentials', ipAddress, userAgent);
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException('Account is locked. Try again later.');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isPasswordValid) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      if (user.loginAttempts >= 5) {
        user.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // Lock for 30 minutes
      }
      await this.userRepository.save(user);
      
      await this.logAuditEvent(user.id, 'User', user.id, OperationType.LOGIN, null, null, 'failure', 'Invalid password', ipAddress, userAgent);
      throw new UnauthorizedException('Invalid email or password');
    }

    // Reset login attempts on successful login
    user.loginAttempts = 0;
    user.lockedUntil = null;
    user.lastLogin = new Date();
    await this.userRepository.save(user);

    // Check if MFA is enabled
    const mfaSetup = await this.mfaSetupRepository.findOne({
      where: { userId: user.id, isEnabled: true },
    });

    if (mfaSetup) {
      const mfaToken = this.jwtService.sign(
        {
          sub: user.id,
          purpose: 'mfa_login',
        },
        { expiresIn: process.env.MFA_LOGIN_TOKEN_EXPIRES_IN || '5m' },
      );

      return {
        mfaRequired: true,
        mfaToken,
        user: this.buildUserResponse(user, true),
      };
    }

    const { accessToken, refreshToken } = await this.issueTokensAndSession(user, ipAddress, userAgent);

    // Log successful login
    await this.logAuditEvent(user.id, 'User', user.id, OperationType.LOGIN, null, { email: user.email }, 'success', null, ipAddress, userAgent);
    await this.logEventLog(user.id, EventCategory.AUTH, 'LOGIN_SUCCESS', `User ${user.email} logged in`);

    return {
      accessToken,
      refreshToken,
      mfaRequired: false,
      user: this.buildUserResponse(user, !!mfaSetup),
    };
  }

  async verifyLoginMfa(mfaToken: string, code: string, ipAddress: string, userAgent: string) {
    let payload: any;
    try {
      payload = this.jwtService.verify(mfaToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired MFA token');
    }

    if (payload?.purpose !== 'mfa_login' || !payload?.sub) {
      throw new UnauthorizedException('Invalid MFA login token');
    }

    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
      relations: ['role', 'role.permissions'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const mfaSetup = await this.mfaSetupRepository.findOne({
      where: { userId: user.id, isEnabled: true },
    });

    if (!mfaSetup) {
      throw new BadRequestException('MFA is not enabled for this user');
    }

    if (mfaSetup.mfaMethod !== MfaMethod.TOTP) {
      throw new BadRequestException('Only TOTP MFA is supported for login verification');
    }

    const isValid = speakeasy.totp.verify({
      secret: mfaSetup.secret,
      encoding: 'base32',
      token: code,
      window: parseInt(process.env.MFA_WINDOW || '1'),
    });

    if (!isValid) {
      throw new UnauthorizedException('Invalid MFA verification code');
    }

    const { accessToken, refreshToken } = await this.issueTokensAndSession(user, ipAddress, userAgent);

    await this.logEventLog(user.id, EventCategory.AUTH, 'LOGIN_MFA_VERIFIED', 'User completed MFA login verification');

    return {
      accessToken,
      refreshToken,
      mfaRequired: true,
      user: this.buildUserResponse(user, true),
    };
  }

  async refreshToken(refreshToken: string, ipAddress: string, userAgent: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const activeSessions = await this.sessionRepository.find({
      where: {
        revokedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
      relations: ['user', 'user.role'],
    });

    let matchedSession: Session | null = null;
    for (const session of activeSessions) {
      const isMatch = await bcrypt.compare(refreshToken, session.refreshTokenHash);
      if (isMatch) {
        matchedSession = session;
        break;
      }
    }

    if (!matchedSession) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const accessToken = this.jwtService.sign({
      sub: matchedSession.user.id,
      email: matchedSession.user.email,
      role: matchedSession.user.role.roleName,
    });

    const rotatedRefreshToken = this.generateRefreshToken();
    matchedSession.accessTokenHash = await bcrypt.hash(accessToken, 10);
    matchedSession.refreshTokenHash = await bcrypt.hash(rotatedRefreshToken, 10);
    matchedSession.ipAddress = ipAddress;
    matchedSession.userAgent = userAgent;
    await this.sessionRepository.save(matchedSession);

    await this.logEventLog(
      matchedSession.user.id,
      EventCategory.AUTH,
      'TOKEN_REFRESHED',
      'Access token refreshed successfully',
    );

    const mfaSetup = await this.mfaSetupRepository.findOne({
      where: { userId: matchedSession.user.id, isEnabled: true },
    });

    return {
      accessToken,
      refreshToken: rotatedRefreshToken,
      user: this.buildUserResponse(matchedSession.user, !!mfaSetup),
    };
  }

  async logout(userId: number, ipAddress: string, userAgent: string) {
    const sessions = await this.sessionRepository.find({ where: { userId } });
    for (const session of sessions) {
      session.revokedAt = new Date();
      await this.sessionRepository.save(session);
    }

    await this.logAuditEvent(userId, 'Session', null, OperationType.LOGOUT, null, null, 'success', null, ipAddress, userAgent);
    await this.logEventLog(userId, EventCategory.AUTH, 'LOGOUT', 'User logged out');
  }

  async changePassword(userId: number, changePasswordDto: ChangePasswordDto, ipAddress: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(changePasswordDto.currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      await this.logAuditEvent(userId, 'User', userId, OperationType.PASSWORD_CHANGE, null, null, 'failure', 'Invalid current password', ipAddress, null);
      throw new UnauthorizedException('Current password is incorrect');
    }

    if (changePasswordDto.newPassword !== changePasswordDto.confirmPassword) {
      throw new BadRequestException('New passwords do not match');
    }

    // Check password history (prevent reuse of last 5 passwords)
    const recentPasswords = await this.passwordHistoryRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 5,
    });

    for (const ph of recentPasswords) {
      const isReused = await bcrypt.compare(changePasswordDto.newPassword, ph.passwordHash);
      if (isReused) {
        throw new BadRequestException('Cannot reuse recent passwords');
      }
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);

    // Save to password history
    const passwordHistory = this.passwordHistoryRepository.create({
      userId,
      passwordHash: user.passwordHash,
    });
    await this.passwordHistoryRepository.save(passwordHistory);

    // Update user password
    user.passwordHash = hashedPassword;
    await this.userRepository.save(user);

    await this.logAuditEvent(userId, 'User', userId, OperationType.PASSWORD_CHANGE, null, { email: user.email }, 'success', null, ipAddress, null);
    await this.logEventLog(userId, EventCategory.AUTH, 'PASSWORD_CHANGED', 'User changed password');
  }

  async setupMfa(userId: number, setupDto: SetupMfaDto, ipAddress: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Check if MFA already exists
    const existingMfa = await this.mfaSetupRepository.findOne({
      where: { userId },
    });

    if (existingMfa && existingMfa.isEnabled) {
      throw new ConflictException('MFA is already enabled');
    }

    let mfaSetup: MfaSetup | undefined;
    let totpUri: string | null = null;

    if (setupDto.mfaMethod === 'totp') {
      // Generate TOTP secret
      const secret = speakeasy.generateSecret({
        name: `HospitalTracker (${user.email})`,
        issuer: process.env.MFA_ISSUER || 'HospitalTracker',
      });
      totpUri = secret.otpauth_url || null;

      mfaSetup = this.mfaSetupRepository.create({
        userId,
        mfaMethod: MfaMethod.TOTP,
        secret: secret.base32,
      });
    } else if (setupDto.mfaMethod === 'sms' || setupDto.mfaMethod === 'email') {
      mfaSetup = this.mfaSetupRepository.create({
        userId,
        mfaMethod: setupDto.mfaMethod === 'sms' ? MfaMethod.SMS : MfaMethod.EMAIL,
        secret: setupDto.phoneNumber || user.email,
      });
    } else {
      throw new BadRequestException('Unsupported MFA method');
    }

    if (!mfaSetup) {
      throw new BadRequestException('MFA setup failed');
    }

    if (existingMfa) {
      mfaSetup.id = existingMfa.id;
    }

    await this.mfaSetupRepository.save(mfaSetup);

    await this.logAuditEvent(userId, 'MfaSetup', mfaSetup.id, OperationType.MFA_SETUP, null, { method: setupDto.mfaMethod }, 'success', null, ipAddress, null);

    return {
      id: mfaSetup.id,
      method: setupDto.mfaMethod,
      qrCode: setupDto.mfaMethod === 'totp' ? totpUri : null,
    };
  }

  async verifyMfaSetup(userId: number, verifyDto: VerifyMfaSetupDto, ipAddress: string) {
    const mfaSetup = await this.mfaSetupRepository.findOne({
      where: { userId },
    });

    if (!mfaSetup) {
      throw new BadRequestException('MFA setup not found');
    }

    if (mfaSetup.mfaMethod === MfaMethod.TOTP) {
      const isValid = speakeasy.totp.verify({
        secret: mfaSetup.secret,
        encoding: 'base32',
        token: verifyDto.code,
        window: parseInt(process.env.MFA_WINDOW || '1'),
      });

      if (!isValid) {
        throw new BadRequestException('Invalid OTP code');
      }
    }

    mfaSetup.isEnabled = true;
    mfaSetup.verifiedAt = new Date();
    await this.mfaSetupRepository.save(mfaSetup);

    await this.logEventLog(userId, EventCategory.AUTH, 'MFA_ENABLED', 'MFA successfully enabled');

    return { message: 'MFA successfully enabled' };
  }

  async validateSession(token: string): Promise<any> {
    try {
      const payload = this.jwtService.verify(token);
      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async getCurrentUserProfile(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['role'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const mfaSetup = await this.mfaSetupRepository.findOne({
      where: { userId: user.id, isEnabled: true },
    });

    return this.buildUserResponse(user, !!mfaSetup);
  }

  private buildUserResponse(user: User, mfaRequired: boolean) {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      employeeCode: user.employeeCode,
      role: {
        id: user.role.id,
        roleName: user.role.roleName,
      },
      mfaRequired,
    };
  }

  private generateRefreshToken(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private async issueTokensAndSession(user: User, ipAddress: string, userAgent: string) {
    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role.roleName,
    });

    const refreshToken = this.generateRefreshToken();
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    const session = this.sessionRepository.create({
      userId: user.id,
      accessTokenHash: await bcrypt.hash(accessToken, 10),
      refreshTokenHash,
      ipAddress,
      userAgent,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    await this.sessionRepository.save(session);

    return { accessToken, refreshToken };
  }

  private async logAuditEvent(
    userId: number | null,
    entityType: string,
    entityId: number | null,
    operation: OperationType,
    oldValues: any,
    newValues: any,
    status: string,
    errorMessage: string | null,
    ipAddress: string,
    userAgent: string | null,
  ) {
    const auditLog = this.auditLogRepository.create({
      userId,
      entityType,
      entityId,
      operation,
      oldValues,
      newValues,
      status,
      errorMessage,
      ipAddress,
      userAgent,
    } as any);
    await this.auditLogRepository.save(auditLog);
  }

  private async logEventLog(userId: number, category: EventCategory, eventName: string, description: string) {
    const eventLog = this.eventLogRepository.create({
      userId,
      category,
      eventName,
      description,
    });
    await this.eventLogRepository.save(eventLog);
  }
}
