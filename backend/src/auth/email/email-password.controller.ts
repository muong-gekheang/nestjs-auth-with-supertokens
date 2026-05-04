import { VerifyOtpSignupDto } from '../phone/dto/verify-otp-sign-up.dto';
import { verify } from 'crypto';
import { Body, Controller, Get, Post, Put, Query, Req, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
import Session from 'supertokens-node/recipe/session';
import EmailPassword from 'supertokens-node/recipe/emailpassword';
import express from 'express';
import { EmailPasswordService } from './email-password.service';
import { EmailPasswordAuthService } from './email-password-auth.service';


@Controller('auth/email')
export class EmailController {
  constructor(
    private readonly emailPasswordAuthService: EmailPasswordAuthService,
    private readonly emailPasswordService: EmailPasswordService,
  ) {}
  
  @Post('signin')
  @ApiBody({
    schema: {
      example: {
        email: 'test@gmail.com',
        password: 'password123'
      }
    }
  })
  async signIn(
    @Body() body: { email: string; password: string },
    @Req() req: express.Request,
    @Res({ passthrough: true }) res: express.Response
  ) {
    const response = await EmailPassword.signIn('public', body.email, body.password);

    if (response.status === 'OK') {
      await Session.createNewSession(req, res, 'public', response.recipeUserId);
      console.log('Response headers after createNewSession:', res.getHeaders());
      return { status: 'OK' };
    }

    return response;
  }

  @Post('send-magic-link')
  @ApiBody({
    schema: {
      example: {
        email: 'john@gmail.com',
        password: 'yourpassword123'
      }
    }
  })
  sendMagicLink(@Body() body: { email: string; password: string }) {
    return this.emailPasswordAuthService.sendMagicLink(body.email, body.password);
  }

  @Get('verify-signup')
  verifySignup(@Query('to ken') token: string) {
    return this.emailPasswordAuthService.verifyMagicLinkAndSignUp(token);
  }

  @Post('change-password')
  @ApiBearerAuth()
  @ApiBody({
    schema: {
      example: {
        oldPassword: 'currentpassword123',
        newPassword: 'newpassword123'
      }
    }
  })
  async changePassword(
    @Body() body: { oldPassword: string, newPassword: string },
    @Req() req: express.Request,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const session = await Session.getSession(req, res);
    const userId = session.getUserId();
    return this.emailPasswordService.changePassword(userId, body.oldPassword, body.newPassword);
  }

  @Get('reset-password-form')
  async resetPasswordForm(@Query('token') token: string) {
    return { status: 'OK', token };
  }

  @Post('forgot-password')
  @ApiBody({
    schema: {
      example: { email: 'john@gmail.com' }
    }
  })
  forgotPassword(@Body() body: { email: string }) {
    return this.emailPasswordService.forgotPassword(body.email);
  }

  @Post('reset-password')
  @ApiBody({
    schema: {
      example: { token: 'token-from-email', newPassword: 'newpassword123' }
    }
  })
  resetPassword(@Body() body: { token: string; newPassword: string }) {
    return this.emailPasswordService.resetPassword(body.token, body.newPassword);
  }
}