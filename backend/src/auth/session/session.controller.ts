import { Controller, Post, Req, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SessionService } from './session.service';
import Session from 'supertokens-node/recipe/session';
import express from 'express';

@Controller('auth/session')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Post('logout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout from current device' })
  async logout(
    @Req() req: express.Request,
    @Res() res: express.Response,
  ) {
    const session = await Session.getSession(req, res);
    await session.revokeSession();
    // const result = await this.sessionService.logout(session.getHandle());
    return res.json({ status: 'OK', message: 'Logged out successfully' });
  }

  @Post('logout-all')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout from all devices' })
  async logoutAll(
    @Req() req: express.Request,
    @Res() res: express.Response,
  ) {
    const session = await Session.getSession(req, res);
    const userId = session.getUserId();
    await session.revokeSession();
    await this.sessionService.logoutAll(userId); 
    // const result = await this.sessionService.logoutAll(userId);
    return res.json({ status: 'OK', message: 'Logged out from all devices' });

  }
}