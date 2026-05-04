import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import Session from 'supertokens-node/recipe/session';

@Injectable()
export class SessionGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest();
    const res = ctx.getResponse();

    console.log('➡️ [SessionGuard] Running:', req.method, req.url);
    console.log('🍪 [SessionGuard] Cookies:', req.headers.cookie);

    try {
      const session = await Session.getSession(req, res, { sessionRequired: true });
      req.session = session;
      console.log('✅ [SessionGuard] Session valid, userId:', session.getUserId());
      return true;
    } catch (err) {
      console.log('⚠️ [SessionGuard] Error type:', err.type);

      if (err.type === Session.Error.TRY_REFRESH_TOKEN) {
        throw new UnauthorizedException({
          status: 'TRY_REFRESH_TOKEN',
          message: 'Access token expired, call POST /auth/st/session/refresh then retry',
        });
      } else if (err.type === Session.Error.UNAUTHORISED) {
        throw new UnauthorizedException({
          status: 'UNAUTHORISED',
          message: 'Session expired, please login again',
        });
      } else {
        throw new UnauthorizedException('Invalid session');
      }
    }
  }
}