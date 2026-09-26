import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class ProductAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const roles = request.user?.roles || [];
    if (!request.user) {
      throw new UnauthorizedException('Authentication required');
    }
    return roles.includes('SUPER_ADMIN') || roles.includes('ADMIN');
  }
}
