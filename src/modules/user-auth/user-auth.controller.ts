import { Body, Controller, Get, Post, Patch, Req, Res, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { UserAuthService } from './user-auth.service';
import { UserRole } from '../../database/entities/enums';
import { AllowUnauthorized } from '../auth/unauthorized/allow-unauthorixed';
import {
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  ApiOkResponseEnvelope,
  ApiCreatedResponseEnvelope,
  ApiBadRequestResponseEnvelope,
  ApiUnauthorizedResponseEnvelope,
  ApiNotFoundResponseEnvelope,
  ApiConflictResponseEnvelope,
} from '../../core/swagger/response-envelope';
import { MessageResponseDto, SuccessResponseDto } from '../../core/dto/message-response.dto';
import { AuthResponseDto, VerifyEmailResponseDto } from './dto/auth-response.dto';
import { User } from '../../database/entities/user.entity';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/password-reset.dto';
import { SignupDto, CreateInfluencerDto, FirebaseLoginDto } from './dto/auth.dto';
import { VerifyEmailDto, ResendOtpDto } from './dto/verify-email.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/Guards/roles.guard';

@ApiTags('User Auth')
@Controller('v1/user-auth')
export class UserAuthController {
  constructor(private readonly auth: UserAuthService) { }

  @AllowUnauthorized()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('signup')
  @ApiOperation({ summary: 'Sign up a new user (regular users only)' })
  @ApiCreatedResponseEnvelope(MessageResponseDto)
  @ApiBadRequestResponseEnvelope('Password mismatch or Admin role signup attempt')
  @ApiConflictResponseEnvelope('Email or Username already registered')
  async signup(@Body() body: SignupDto) {
    return this.auth.signup(body.email, body.password, body.confirmPassword, body.role, body.referralCode, body.username);
  }

  @AllowUnauthorized()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('verify-email')
  @ApiOperation({ summary: 'Verify email with OTP and get access token' })
  @ApiOkResponseEnvelope(VerifyEmailResponseDto)
  @ApiBadRequestResponseEnvelope('Invalid/Expired OTP or already verified')
  @ApiNotFoundResponseEnvelope('User not found')
  async verifyEmail(@Body() body: VerifyEmailDto) {
    return this.auth.verifyEmail(body);
  }

  @AllowUnauthorized()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('resend-verify-email')
  @ApiOperation({ summary: 'Resend verification OTP email' })
  @ApiOkResponseEnvelope(MessageResponseDto)
  @ApiBadRequestResponseEnvelope('Account already verified')
  @ApiNotFoundResponseEnvelope('User not found')
  async resendVerifyEmail(@Body() body: ResendOtpDto) {
    return this.auth.resendVerifyEmail(body.email);
  }

  @AllowUnauthorized()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(AuthGuard('local-user'))
  @Post('login')
  @ApiOperation({ summary: 'Login for all user types (USER, INFLUENCER, ADMIN)' })
  @ApiOkResponseEnvelope(AuthResponseDto)
  @ApiUnauthorizedResponseEnvelope('Invalid credentials or account suspended/unverified')
  async login(@Req() req: Request) {
    // req.user is set by Local Strategy
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = (req as any).user;
    return this.auth.login(user);
  }

  @AllowUnauthorized()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('firebase-login')
  @ApiOperation({ summary: 'Login or signup with Firebase ID Token' })
  @ApiOkResponseEnvelope(AuthResponseDto)
  @ApiUnauthorizedResponseEnvelope('Invalid Firebase ID token')
  async firebaseLogin(@Body() body: FirebaseLoginDto) {
    return this.auth.loginWithFirebase(body.idToken, body.role);
  }

    @UseGuards(AuthGuard('jwt-user'), RolesGuard)
    @Roles(UserRole.USER, UserRole.INFLUENCER, UserRole.ADMIN)
    @Get('me')
    @ApiOperation({ summary: 'Get current authenticated user profile' })
    @ApiOkResponseEnvelope(User)
    @ApiUnauthorizedResponseEnvelope('Invalid or missing JWT')
    async me(@Req() req: Request) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload = (req as any).user as { id: string };
    return this.auth.me(payload.id);
  }

  @Roles(UserRole.ADMIN)
  @UseGuards(AuthGuard('jwt-user'), RolesGuard)
  @Post('admin/create-influencer')
  @ApiOperation({ summary: 'Admin creates an influencer account' })
  @ApiCreatedResponseEnvelope(User)
  @ApiBadRequestResponseEnvelope('Password mismatch')
  @ApiConflictResponseEnvelope('Email or Username already taken')
  async createInfluencer(@Body() body: CreateInfluencerDto) {
    return this.auth.createInfluencer(body.email, body.password, body.confirmPassword, body.username);
  }

  @UseGuards(AuthGuard('jwt-user'), RolesGuard)
  @Roles(UserRole.USER, UserRole.INFLUENCER, UserRole.ADMIN)
  @Post('logout')
  @ApiOperation({ summary: 'Logout current user (client should clear stored JWT)' })
  @ApiOkResponseEnvelope(SuccessResponseDto)
  @ApiUnauthorizedResponseEnvelope('Invalid or missing JWT')
  async logout() {
    return { success: true };
  }

  // Initiate Google OAuth
  @AllowUnauthorized()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth login flow' })
  async googleAuth() {
    return;
  }

  // Google OAuth callback
  @AllowUnauthorized()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Handle Google OAuth callback and redirect with JWT' })
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const profile = (req as any).user as { email: string; name?: string };
    const result = await this.auth.upsertGoogleUser({ email: profile.email, name: profile.name });
    // Redirect with token as query (frontend should capture and store)
    const redirectUrl = process.env.GOOGLE_FRONTEND_REDIRECT_LINK || 'http://localhost:3001/auth/callback';
    const url = `${redirectUrl}?token=${encodeURIComponent(result.access_token)}`;
    return res.redirect(url);
  }

  @AllowUnauthorized()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset email' })
  @ApiOkResponseEnvelope(MessageResponseDto)
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.auth.forgotPassword(body.email);
  }

  @AllowUnauthorized()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password using token from email' })
  @ApiOkResponseEnvelope(MessageResponseDto)
  @ApiBadRequestResponseEnvelope('Invalid or expired token')
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.auth.resetPassword(body.userId, body.token, body.newPassword);
  }

  @UseGuards(AuthGuard('jwt-user'), RolesGuard)
  @Roles(UserRole.USER, UserRole.INFLUENCER, UserRole.ADMIN)
  @Patch('change-password')
  @ApiOperation({ summary: 'Update password for authenticated user' })
  @ApiOkResponseEnvelope(MessageResponseDto)
  @ApiBadRequestResponseEnvelope('Incorrect current password or social account')
  @ApiNotFoundResponseEnvelope('User not found')
  async changePassword(@Req() req: Request, @Body() body: ChangePasswordDto) {
    const user = (req as any).user;
    return this.auth.changePassword(user.id, body.currentPassword, body.newPassword);
  }
}
