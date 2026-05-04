import { CanActivate, ExecutionContext, ForbiddenException, Injectable, SetMetadata } from "@nestjs/common";
import { Reflector } from "@nestjs/core";


export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate{
  constructor(private reflector: Reflector) {} // Reflector is a NestJS utility that reads metadata attached to routes or controllers.
  
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // get required roles from the decorator
    const requiredRoles = this.reflector.get<string[]>(ROLES_KEY, context.getHandler());

    if (!requiredRoles) return true; // no roles required, allow through

    const req = context.switchToHttp().getRequest();
    console.log("Cookies:", req.headers.cookie);
    const roleData = req.session.getAccessTokenPayload()['st-role'];
    const userRoles: string[] = roleData?.v ?? [];

    const hasRole = requiredRoles.some(role => userRoles.includes(role));

    if (!hasRole) {
      throw new ForbiddenException('No permission');
    }

    return true;
  }
}