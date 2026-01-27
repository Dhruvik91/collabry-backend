import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

import { ROLES } from 'src/modules/auth/types/types';

export class RoleGuard implements CanActivate {
  constructor(private readonly role: ROLES) {}

  canActivate(context: ExecutionContext): boolean {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    return request?.user.role == this.role;
  }
}
