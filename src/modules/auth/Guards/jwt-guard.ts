import { Injectable, type ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { ALLOW_UNAUTHORIZED_KEY } from '../unauthorized/allow-unauthorixed';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt-user') {
  constructor(private readonly reflector: Reflector) {
    super();
  }
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    if (this.reflector.get(ALLOW_UNAUTHORIZED_KEY, context.getHandler())) {
      return true;
    }
    return super.canActivate(context);
  }
}
