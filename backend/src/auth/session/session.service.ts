import Session from 'supertokens-node/recipe/session';
import { Injectable } from "@nestjs/common";

@Injectable()
export class SessionService{
  async logout(sessionHandle: string) {
    await Session.revokeSession(sessionHandle);
    return { status: 'OK', message: 'Logged out successfully' };
  }

  async logoutAll(userId: string) {
    await Session.revokeAllSessionsForUser(userId);
    return { status: 'OK', message: 'Logged out from all devices successfully' };
  }
}