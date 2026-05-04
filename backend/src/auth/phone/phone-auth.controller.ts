import { Controller, Post, Body, Req, Res } from '@nestjs/common';
import { PhoneAuthService } from './phone-auth.service';
import Session from 'supertokens-node/recipe/session';
import EmailPassword from 'supertokens-node/recipe/emailpassword';
import express from 'express';
import { ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { VerifyOtpSignupDto } from './dto/verify-otp-sign-up.dto';
import { SigninDto } from './dto/sign-in.dto';
import { SendOtpDto } from './dto/send-otp.dto';
 
@ApiBearerAuth()
@Controller('phone-auth')
export class PhoneAuthController {
  constructor(private readonly phoneAuthService: PhoneAuthService) {}

  @Post('send-otp')
  async sendOtp(@Body() body: SendOtpDto) {
    return this.phoneAuthService.sendOtp(body.phone)
  }

  @Post('verify-otp-signup')
  async verifyOtpAndSignup(@Body() body: VerifyOtpSignupDto) {
    return this.phoneAuthService.verifyOtpAndSignup(body.phone, body.password, body.otp)
  }

  @Post('signin')
  async signin(
    @Body() body: SigninDto,
    @Req() req: express.Request,
    @Res() res: express.Response,
  ) {
    const result = await this.phoneAuthService.signIn(body.phone, body.password)

    if (result.status === 'OK') {
      await Session.createNewSession(req, res, 'public', result.recipeUserId!)
      res.send({ status: 'OK' })
    } else {
      res.send(result)
    }
  }

  @Post('reset-password')
  @ApiBody({
    schema: {
      example: {
        oldPassword: 'currentpassword123',
        newPassword: 'newpassword123',
      },
    },
  })
  async resetPassword(
    @Body() body: { oldPassword: string; newPassword: string },
    @Req() req: express.Request,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const session = await Session.getSession(req, res);
    const userId = session.getUserId();
    return this.phoneAuthService.resetPassword(userId, body.oldPassword, body.newPassword);
  }

  @Post('forgot-password/send-otp')
  @ApiBody({
    schema: {
      example: {
        phone: '+85512345678',
      },
    },
  })
  async sendForgotPasswordOtp(@Body() body: { phone: string }) {
    return this.phoneAuthService.sendForgotPasswordOtp(body.phone);
  }

  @Post('forgot-password')
  @ApiBody({
    schema: {
      example: {
        phone: '+85512345678',
        otp: '0000',
        newPassword: 'newpassword123',
      },
    },
  })
  async forgotPassword(
    @Body() body: { phone: string; otp: string; newPassword: string },
  ) {
    return this.phoneAuthService.forgotPassword(body.phone, body.otp, body.newPassword);
  }

  
}