import { IsEmail, IsString, MinLength, IsNotEmpty, IsOptional } from 'class-validator';

export class LoginRequestDto {
  @IsOptional()
  @IsEmail({}, { message: 'Must be a valid email address' })
  email?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  loginId?: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;
}

export class VerifyMfaDto {
  @IsNotEmpty()
  @IsString()
  token: string;

  @IsNotEmpty()
  @IsString()
  code: string; // OTP code
}

export class AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    email: string;
    fullName: string;
    employeeCode: string;
    role: {
      id: number;
      roleName: string;
    };
    mfaRequired: boolean;
  };
}

export class CurrentUserResponseDto {
  id: number;
  email: string;
  fullName: string;
  employeeCode: string;
  role: {
    id: number;
    roleName: string;
  };
  mfaRequired: boolean;
}

export class RefreshTokenDto {
  @IsNotEmpty()
  @IsString()
  refreshToken: string;
}

export class ChangePasswordDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  currentPassword: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'New password must be at least 8 characters' })
  newPassword: string;

  @IsNotEmpty()
  @IsString()
  confirmPassword: string;
}

export class SetupMfaDto {
  @IsNotEmpty()
  @IsString()
  mfaMethod: 'totp' | 'sms' | 'email';

  phoneNumber?: string;
}

export class VerifyMfaSetupDto {
  @IsNotEmpty()
  @IsString()
  code: string; // OTP verification code
}
