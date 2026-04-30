import { Controller, Post, Body, Req, Res } from '@nestjs/common';
import { PhoneAuthService } from './phone-auth.service';
import Session from 'supertokens-node/recipe/session';
import EmailPassword from 'supertokens-node/recipe/emailpassword';
import express from 'express';
import { ApiBearerAuth } from '@nestjs/swagger';
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

  
}