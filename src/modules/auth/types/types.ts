import { IsEmail, IsStrongPassword } from 'class-validator';
import { UUID } from 'crypto';

export interface PayloadDataResponse {
  id: UUID;
  email: string;
  role: string;
  name?: string;
}

export enum ROLES {
  SUPER_ADMIN = 'super_admin',
  PROPERTY_OWNER = 'property_owner',
}

export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @IsStrongPassword()
  password: string;
}
