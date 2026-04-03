import { Injectable, ConflictException, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';

import { User } from '../../database/entities/user.entity';
import { UserRole, UserStatus } from '../../database/entities/enums';
import { HashingService } from '../../core/hashing/hashing';
import { MailerService } from '../mailer/mailer.service';
import { SignupDto } from './dto/auth.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';

export type JwtPayload = { id: string; email: string; role: UserRole };

@Injectable()
export class UserAuthService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    private readonly hashing: HashingService,
    private readonly jwt: JwtService,
    private readonly mailerService: MailerService,
  ) { }

  async signup(email: string, password: string, confirmPassword: string, role: UserRole = UserRole.USER) {
    // Validate password confirmation
    if (password !== confirmPassword) {
      throw new BadRequestException('Password and confirm password do not match');
    }

    // Prevent direct signup for ADMIN role
    if (role === UserRole.ADMIN) {
      throw new BadRequestException('Cannot sign up with Admin role');
    }

    const exists = await this.usersRepo.findOne({ where: { email } });
    if (exists) throw new ConflictException('Email already registered');

    const passwordHash = await this.hashing.hash(password);
    
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await this.hashing.hash(otp);
    const otpExpires = new Date();
    otpExpires.setMinutes(otpExpires.getMinutes() + 10); // 10 minutes expiry

    // Create user with PENDING status
    const user = this.usersRepo.create({ 
      email, 
      role, 
      passwordHash,
      status: UserStatus.PENDING,
      emailVerified: false,
      otp: otpHash,
      otpExpires
    });
    
    await this.usersRepo.save(user);

    // Send verification email
    await this.mailerService.sendVerificationEmail(email, otp);

    return { message: 'Verification code sent to your email. Please verify your account to continue.' };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const { email, otp } = dto;
    const user = await this.usersRepo.findOne({
      where: { email },
      select: ['id', 'email', 'role', 'status', 'otp', 'otpExpires']
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.status !== UserStatus.PENDING) {
      throw new BadRequestException('Account is already verified or not in pending state');
    }

    if (!user.otp || !user.otpExpires) {
      throw new BadRequestException('No verification code found for this account');
    }

    if (new Date() > user.otpExpires) {
      throw new BadRequestException('Verification code has expired');
    }

    const isOtpValid = await this.hashing.compare(otp, user.otp);
    if (!isOtpValid) {
      throw new BadRequestException('Invalid verification code');
    }

    // Update user to ACTIVE
    user.status = UserStatus.ACTIVE;
    user.emailVerified = true;
    user.otp = null;
    user.otpExpires = null;
    
    const savedUser = await this.usersRepo.save(user);

    // Generate token for the verified user
    const token = this.generateToken({ id: savedUser.id, email: savedUser.email, role: savedUser.role });

    // Exclude sensitive fields from response
    const { otp: _, otpExpires: __, ...userWithoutOtp } = savedUser;
    
    return { 
      message: 'Email verified successfully',
      access_token: token, 
      user: userWithoutOtp 
    };
  }

  async resendVerifyEmail(email: string) {
    const user = await this.usersRepo.findOne({
      where: { email },
      select: ['id', 'email', 'status']
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.status !== UserStatus.PENDING) {
      throw new BadRequestException('Account is already verified');
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await this.hashing.hash(otp);
    const otpExpires = new Date();
    otpExpires.setMinutes(otpExpires.getMinutes() + 10);

    user.otp = otpHash;
    user.otpExpires = otpExpires;
    
    await this.usersRepo.save(user);

    // Send new verification email
    await this.mailerService.sendVerificationEmail(email, otp);

    return { message: 'New verification code sent to your email.' };
  }

  async validateUser(email: string, password: string) {
    const user = await this.usersRepo.findOne({
      where: { email },
      select: ['id', 'email', 'role', 'status', 'emailVerified', 'passwordHash', 'createdAt', 'updatedAt']
    });
    if (!user || !user.passwordHash) return null;
    const match = await this.hashing.compare(password, user.passwordHash);
    if (!match) return null;
    
    // Ensure user is verified/active
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Please verify your email address before logging in.');
    }
    
    return user;
  }

  generateToken(payload: JwtPayload) {
    return this.jwt.sign(payload);
  }

  async login(user: User) {
    const token = this.generateToken({ id: user.id, email: user.email, role: user.role });

    // Exclude passwordHash from response
    const { passwordHash: _, ...userWithoutPassword } = user;
    return { access_token: token, user: userWithoutPassword };
  }

  async createInfluencer(email: string, password: string, confirmPassword: string) {
    // Validate password confirmation
    if (password !== confirmPassword) {
      throw new BadRequestException('Password and confirm password do not match');
    }

    const exists = await this.usersRepo.findOne({ where: { email } });
    if (exists) throw new ConflictException('Email already registered');

    const passwordHash = await this.hashing.hash(password);
    // Create user with INFLUENCER role
    const user = this.usersRepo.create({ email, role: UserRole.INFLUENCER, passwordHash });
    const saved = await this.usersRepo.save(user);

    // Exclude passwordHash from response
    const { passwordHash: _, ...userWithoutPassword } = saved;
    return { user: userWithoutPassword };
  }

  async upsertGoogleUser(profile: { email: string; name?: string }) {
    const email = profile.email;
    if (!email) throw new UnauthorizedException('Google profile missing email');
    let user = await this.usersRepo.findOne({ where: { email } });
    if (!user) {
      user = this.usersRepo.create({ email, role: UserRole.USER, passwordHash: null });
      user = await this.usersRepo.save(user);
    }
    return this.login(user);
  }

  async me(userId: string) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) return null;

    // Exclude passwordHash from response
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.usersRepo.findOne({ where: { email } });

    // Always return success message to prevent email enumeration
    if (!user) {
      return { message: 'If an account with that email exists, a password reset link has been sent.' };
    }

    // Generate a secure random token
    const resetToken = randomBytes(32).toString('hex');
    const resetTokenHash = await this.hashing.hash(resetToken);

    // Set token expiry to 1 hour from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Save hashed token and expiry to user
    user.passwordResetToken = resetTokenHash;
    user.passwordResetExpires = expiresAt;
    await this.usersRepo.save(user);

    // Send email with the plain token (not hashed)
    await this.mailerService.sendPasswordResetEmail(email, resetToken);

    return { message: 'If an account with that email exists, a password reset link has been sent.' };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    // Find users with non-expired reset tokens
    const users = await this.usersRepo
      .createQueryBuilder('user')
      .addSelect('user.passwordResetToken')
      .where('user.passwordResetToken IS NOT NULL')
      .andWhere('user.passwordResetExpires > :now', { now: new Date() })
      .getMany();

    // Find the user whose token matches
    let matchedUser: User | null = null;
    for (const user of users) {
      if (user.passwordResetToken) {
        const isMatch = await this.hashing.compare(token, user.passwordResetToken);
        if (isMatch) {
          matchedUser = user;
          break;
        }
      }
    }

    if (!matchedUser) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    // Hash the new password and clear reset token
    matchedUser.passwordHash = await this.hashing.hash(newPassword);
    matchedUser.passwordResetToken = null;
    matchedUser.passwordResetExpires = null;
    await this.usersRepo.save(matchedUser);

    return { message: 'Password has been reset successfully. You can now log in with your new password.' };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.usersRepo.findOne({
      where: { id: userId },
      select: ['id', 'passwordHash']
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.passwordHash) {
      throw new BadRequestException('User does not have a password set (likely a Google user). Please use forgot password to set one.');
    }

    const isMatch = await this.hashing.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestException('Current password is incorrect');
    }

    user.passwordHash = await this.hashing.hash(newPassword);
    await this.usersRepo.save(user);

    return { message: 'Password updated successfully' };
  }
}
