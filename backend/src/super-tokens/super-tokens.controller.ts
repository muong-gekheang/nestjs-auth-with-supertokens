import EmailPassword from 'supertokens-node/recipe/emailpassword';
import Passwordless from 'supertokens-node/recipe/passwordless';
import Session from 'supertokens-node/recipe/session';
import express from 'express'
import { Controller, Get, Post, Body, Patch, Param, Delete, Req, Res, Query } from '@nestjs/common';
import { SuperTokensService } from './super-tokens.service';
import { CreateSuperTokenDto } from './dto/create-super-token.dto';
import { UpdateSuperTokenDto } from './dto/update-super-token.dto';
import e from 'express';
import SuperTokens from 'supertokens-node'
import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
@Controller('super-tokens')
export class SuperTokensController {
  constructor(private readonly superTokensService: SuperTokensService) { }

  @Post('email-signup')
  @ApiBody({
    schema: {
      example: {
        email: 'test@gmail.com',
        password: 'password123'
      }
    }
  })
  async emailSignup(@Body() body: { email: string; password: string }) {
    return EmailPassword.signUp('public', body.email, body.password);
  }

  @Post('email-signin')
  @ApiBody({
    schema: {
      example: {
        email: 'test@gmail.com',
        password: 'password123'
      }
    }
  })
  async emailSignin(
    @Body() body: { email: string; password: string },
    @Req() req: express.Request,
    @Res() res: express.Response,
  ) {
    const response = await EmailPassword.signIn(
      'public',
      body.email,
      body.password
    );

    if (response.status === 'OK') {
      await Session.createNewSession(
        req,
        res,
        'public',
        response.recipeUserId
      );

      return res.send({ status: 'OK' });
    }

    return res.json(response);
  }
  
  @Post('phone-signup')
  async phoneSignup(@Body() body: { phone: string; password: string }) {
    console.log('phone-signup called', body) 
    return this.superTokensService.phoneSignUp(body.phone, body.password);
  }

  @Post('phone-signin')
  async phoneSignin(
    @Body() body: { phone: string; password: string },
    @Req() req: express.Request, 
    @Res() res: express.Response,
  ) {
    const result = await this.superTokensService.phoneSignIn(body.phone, body.password)
    if (result.status === 'OK') {
      const users = await SuperTokens.listUsersByAccountInfo('public', {
        phoneNumber: body.phone
      })
      const user = users[0]
      await Session.createNewSession(req, res, 'public', user!.loginMethods[0].recipeUserId)
      console.log('session created')
      res.send({ status: 'OK' })
    } else {
      res.json(result);
    }
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
    @Body() body: { oldPassword: string; newPassword: string },
    @Req() req: express.Request,
      @Res({ passthrough: true }) res: express.Response, 
  ) {
    // Get userId from session token
    const session = await Session.getSession(req, res);
    const userId = session.getUserId();
  
    return this.superTokensService.changePassword(
      userId,
      body.oldPassword,
      body.newPassword
    );
  }

  @Post('forgot-password')
  @ApiBody({
    schema: {
      example: { email: 'john@gmail.com' }
    }
  })
  async forgotPassword(@Body() body: { email: string }) {
    return this.superTokensService.forgotPassword(body.email);
  }

  @Post('reset-password')
  @ApiBody({
    schema: {
      example: {
        token: 'token-from-email',
        newPassword: 'newpassword123'
      }
    }
  })
  async resetPassword(
    @Body() body: { token: string; newPassword: string }
  ) {
    return this.superTokensService.resetPassword(
      body.token,
      body.newPassword
    );
  }

  @Post('verify-email')
  @ApiBody({
    schema: {
      example: { token: 'your-token-from-email-link' }
    }
  })
  async verifyEmail(@Body() body: { token: string }) {
    return this.superTokensService.verifyEmail(body.token);
  }

  @Post('send-magic-link')
  @ApiBody({
    schema: {
      example: { email: 'john@gmail.com', password: 'yourpassword123' }
    }
  })
async sendMagicLink(@Body() body: { email: string; password: string }) {
  return this.superTokensService.sendMagicLink(body.email, body.password);
}

  @Get('verify-signup')
  async verifySignup(@Query('token') token: string) {
    return this.superTokensService.verifyMagicLinkAndSignup(token);
  }

}
