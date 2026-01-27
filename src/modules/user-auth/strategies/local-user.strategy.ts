import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserAuthService } from '../user-auth.service';
import { User } from '../../../database/entities/user.entity';

@Injectable()
export class LocalUserStrategy extends PassportStrategy(Strategy, 'local-user') {
  constructor(private readonly auth: UserAuthService) {
    super({ usernameField: 'email', passwordField: 'password' });
  }

  async validate(email: string, password: string): Promise<User> {
    const user = await this.auth.validateUser(email, password);
    if (!user) throw new UnauthorizedException("Invalid credentials");
    return user;
  }
}
