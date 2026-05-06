import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { User } from '../user/entities/user.entity';
import { Session } from './entities/session.entity';
import { MfaSetup } from './entities/mfa-setup.entity';
import { PasswordHistory } from './entities/password-history.entity';
import { AuditLog } from '../../common/entities/audit-log.entity';
import { EventLog } from '../../common/entities/event-log.entity';

@Module({
  imports: [
    PassportModule,
    TypeOrmModule.forFeature([
      User,
      Session,
      MfaSetup,
      PasswordHistory,
      AuditLog,
      EventLog,
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
