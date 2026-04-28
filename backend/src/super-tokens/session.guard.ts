// supertokens-session.guard.ts
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { verifySession } from 'supertokens-node/recipe/session/framework/express';

@Injectable()
export class SessionGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest();
    const res = ctx.getResponse();

    await new Promise<void>((resolve, reject) => {
      verifySession()(req, res, (err) => {
        if (err) reject(new UnauthorizedException('Invalid session'));
        else resolve();
      });
    });

    return true;
  }
}