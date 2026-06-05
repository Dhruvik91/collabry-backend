import { Injectable, ConflictException, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { randomBytes, randomInt } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { User } from '../../database/entities/user.entity';
import { UserRole, UserStatus } from '../../database/entities/enums';
import { HashingService } from '../../core/hashing/hashing';
import { AppMailerService } from '../mailer/mailer.service';
import { ReferralService } from '../referral/referral.service';
import { WalletService } from '../kc-wallet/wallet.service';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { KCSettingService, KCSettingKey } from '../kc-setting/kc-setting.service';
import { TransactionPurpose } from '../../database/entities/enums';

export type JwtPayload = { id: string; email: string; role: UserRole };

@Injectable()
export class UserAuthService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    private readonly hashing: HashingService,
    private readonly jwt: JwtService,
    private readonly mailerService: AppMailerService,
    private readonly referralService: ReferralService,
    private readonly walletService: WalletService,
    private readonly settingService: KCSettingService,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) { }

  async signup(email: string, password: string, confirmPassword: string, role: UserRole = UserRole.USER, referredBy?: string, username?: string) {
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

    if (username) {
      const usernameExists = await this.usersRepo.findOne({ where: { username } });
      if (usernameExists) throw new ConflictException('Username already taken');
    }

    const passwordHash = await this.hashing.hash(password);

    // Generate secure 6-digit OTP
    const otp = randomInt(100000, 999999).toString();
    const otpHash = await this.hashing.hash(otp);
    const otpExpires = new Date();
    otpExpires.setMinutes(otpExpires.getMinutes() + 10); // 10 minutes expiry

    // Generate unique referral code for the new user
    const referralCode = await this.referralService.generateUniqueReferralCode();

    // Create user with PENDING status
    const user = this.usersRepo.create({
      email,
      role,
      passwordHash,
      status: UserStatus.PENDING,
      emailVerified: false,
      otp: otpHash,
      otpExpires,
      referralCode,
      referredBy,
      username,
    });

    // Use a transaction to ensure user and referral tracking are atomic
    await this.dataSource.transaction(async (manager) => {
      const savedUser = await manager.save(user);

      // Initialize wallet
      await this.walletService.createWallet(savedUser.id, 0, manager);

      // Link referral if provided
      if (referredBy) {
        await this.referralService.registerReferral(savedUser.id, referredBy, manager);
      }
    });

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

    // Reward referral if applicable
    await this.referralService.rewardReferral(user.id);

    // Award New Arrival Bonus
    const bonusAmount = await this.settingService.getSetting(KCSettingKey.NEW_ARRIVAL_BONUS_AMOUNT);
    if (bonusAmount > 0) {
      await this.walletService.credit(
        user.id,
        bonusAmount,
        TransactionPurpose.NEW_ARRIVAL_BONUS
      );
    }

    const loginData = await this.login(savedUser, true);

    return {
      message: 'Email verified successfully',
      ...loginData
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

    // Generate secure new OTP
    const otp = randomInt(100000, 999999).toString();
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

    // Handle inactive accounts (Deactivated) - Auto-reactivate on login
    if (user.status === UserStatus.INACTIVE) {
      user.status = UserStatus.ACTIVE;
      await this.usersRepo.save(user);
    }

    // Ensure user is verified/active
    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('Your account has been suspended. Please contact support.');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Please verify your email address before logging in.');
    }

    return user;
  }

  generateToken(payload: JwtPayload) {
    return this.jwt.sign(payload);
  }

  async login(user: User, isNewUser = false) {
    const token = this.generateToken({ id: user.id, email: user.email, role: user.role });

    // Exclude passwordHash from response
    const { passwordHash: _, ...userWithoutPassword } = user;
    return { access_token: token, user: userWithoutPassword, isNewUser };
  }

  async createInfluencer(email: string, password: string, confirmPassword: string, username?: string) {
    // Validate password confirmation
    if (password !== confirmPassword) {
      throw new BadRequestException('Password and confirm password do not match');
    }

    const exists = await this.usersRepo.findOne({ where: { email } });
    if (exists) throw new ConflictException('Email already registered');

    if (username) {
      const usernameExists = await this.usersRepo.findOne({ where: { username } });
      if (usernameExists) throw new ConflictException('Username already taken');
    }

    const passwordHash = await this.hashing.hash(password);
    // Create user with INFLUENCER role
    const user = this.usersRepo.create({ email, role: UserRole.INFLUENCER, passwordHash, username });
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
      // Generate unique referral code
      const referralCode = await this.referralService.generateUniqueReferralCode();

      user = this.usersRepo.create({ email, role: UserRole.USER, passwordHash: null, referralCode });
      user = await this.usersRepo.save(user);

      // Create wallet
      await this.walletService.createWallet(user.id, 0);

      // Award New Arrival Bonus
      const bonusAmount = await this.settingService.getSetting(KCSettingKey.NEW_ARRIVAL_BONUS_AMOUNT);
      if (bonusAmount > 0) {
        await this.walletService.credit(
          user.id,
          bonusAmount,
          TransactionPurpose.NEW_ARRIVAL_BONUS
        );
      }
      return this.login(user, true);
    }
    return this.login(user, false);
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

    // Send email with the plain token (not hashed) and user ID for O(1) lookup
    await this.mailerService.sendPasswordResetEmail(email, resetToken, user.id);

    return { message: 'If an account with that email exists, a password reset link has been sent.' };
  }

  async resetPassword(userId: string, token: string, newPassword: string): Promise<{ message: string }> {
    // 1. Efficient O(1) lookup by user ID
    const user = await this.usersRepo
      .createQueryBuilder('user')
      .addSelect('user.passwordResetToken')
      .addSelect('user.passwordResetExpires')
      .where('user.id = :userId', { userId })
      .getOne();

    if (!user || !user.passwordResetToken || !user.passwordResetExpires) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    // 2. Check expiry
    if (new Date() > user.passwordResetExpires) {
      throw new BadRequestException('Password reset token has expired');
    }

    // 3. Verify token hash
    const isMatch = await this.hashing.compare(token, user.passwordResetToken);
    if (!isMatch) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    // 4. Hash the new password and clear reset token
    user.passwordHash = await this.hashing.hash(newPassword);
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await this.usersRepo.save(user);

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

  private firebaseApp: any = null;

  private getFirebaseApp() {
    if (this.firebaseApp) return this.firebaseApp;

    const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
    const privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY');

    if (!projectId || !clientEmail || !privateKey) {
      throw new BadRequestException('Firebase Admin credentials are not configured');
    }

    // Replace literal '\n' in the private key string if passed as environment variable
    const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

    try {
      const admin = require('firebase-admin');
      if (admin.apps.length === 0) {
        this.firebaseApp = admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey: formattedPrivateKey,
          }),
        });
      } else {
        this.firebaseApp = admin.apps[0];
      }
      return this.firebaseApp;
    } catch (error) {
      throw new BadRequestException(`Failed to initialize Firebase Admin SDK: ${error.message}`);
    }
  }

  async verifyFirebaseToken(idToken: string): Promise<any> {
    this.getFirebaseApp();
    try {
      const admin = require('firebase-admin');
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      return decodedToken;
    } catch (error) {
      throw new UnauthorizedException(`Invalid Firebase token: ${error.message}`);
    }
  }

  async loginWithFirebase(idToken: string, requestedRole: UserRole = UserRole.USER) {
    const decodedToken = await this.verifyFirebaseToken(idToken);
    const { email, uid: firebaseUid } = decodedToken;

    if (!email) {
      throw new BadRequestException('Firebase token does not contain email');
    }

    let user = await this.usersRepo.findOne({
      where: [{ firebaseUid }, { email }],
    });

    if (!user) {
      // Create user if they don't exist
      const referralCode = await this.referralService.generateUniqueReferralCode();
      user = this.usersRepo.create({
        email,
        firebaseUid,
        role: requestedRole === UserRole.ADMIN ? UserRole.USER : requestedRole, // prevent admin registration
        status: UserStatus.ACTIVE, // Firebase verified users are active immediately
        emailVerified: true,
        passwordHash: null,
        referralCode,
      });

      user = await this.usersRepo.save(user);

      // Create wallet
      await this.walletService.createWallet(user.id, 0);

      // Award New Arrival Bonus
      const bonusAmount = await this.settingService.getSetting(KCSettingKey.NEW_ARRIVAL_BONUS_AMOUNT);
      if (bonusAmount > 0) {
        await this.walletService.credit(
          user.id,
          bonusAmount,
          TransactionPurpose.NEW_ARRIVAL_BONUS
        );
      }

      return this.login(user, true);
    } else {
      // If user exists but has no firebaseUid associated, associate it now
      if (!user.firebaseUid) {
        user.firebaseUid = firebaseUid;
        user = await this.usersRepo.save(user);
      }
      return this.login(user, false);
    }
  }
}
