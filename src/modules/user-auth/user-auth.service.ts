import { Injectable, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';

import { User } from '../../database/entities/user.entity';
import { UserRole } from '../../database/entities/enums';
import { HashingService } from '../../core/hashing/hashing';
import { MailerService } from '../mailer/mailer.service';

export type JwtPayload = { id: string; email: string; role: UserRole };

@Injectable()
export class UserAuthService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    private readonly hashing: HashingService,
    private readonly jwt: JwtService,
    private readonly mailerService: MailerService,
  ) { }

  async signup(email: string, password: string, confirmPassword: string) {
    // Validate password confirmation
    if (password !== confirmPassword) {
      throw new BadRequestException('Password and confirm password do not match');
    }

    const exists = await this.usersRepo.findOne({ where: { email } });
    if (exists) throw new ConflictException('Email already registered');

    const passwordHash = await this.hashing.hash(password);
    // Force role to USER for regular signup
    const user = this.usersRepo.create({ email, role: UserRole.USER, passwordHash });
    const saved = await this.usersRepo.save(user);
    const token = this.generateToken({ id: saved.id, email: saved.email, role: saved.role });

    // Exclude passwordHash from response
    const { passwordHash: _, ...userWithoutPassword } = saved;
    return { access_token: token, user: userWithoutPassword };
  }

  async validateUser(email: string, password: string) {
    const user = await this.usersRepo.findOne({
      where: { email },
      select: ['id', 'email', 'role', 'status', 'emailVerified', 'passwordHash', 'createdAt', 'updatedAt']
    });
    if (!user || !user.passwordHash) return null;
    const match = await this.hashing.compare(password, user.passwordHash);
    if (!match) return null;
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
}
