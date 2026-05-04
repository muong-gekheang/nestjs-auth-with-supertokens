import { Body, Controller, Get, Post, Query, Req, Res } from '@nestjs/common';
import { ThirdPartyService } from './third-party.service';
import Session from 'supertokens-node/recipe/session';
import express from 'express';
import { ApiBody } from '@nestjs/swagger';
import { RecipeUserId } from 'supertokens-node';

@Controller('auth/third-party')
export class ThirdPartyController {
  constructor(private readonly thirdPartyService: ThirdPartyService) {}

  @Get('authorization-url')
  getAuthorisationUrl(
    @Query('provider') provider: string,
    @Query('redirectURI') redirectURI: string,
  ) {
    return this.thirdPartyService.getAuthorisationUrl(provider, redirectURI);
  }

  @Post('signin')
  @ApiBody({
    schema: {
      example: {
        thirdPartyId: 'google',
        oAuthTokens: {
          access_token: 'google-access-token-here',
        },
      },
    },
  })
  async signIn(
    @Body() body: { thirdPartyId: string; oAuthTokens: any },
    @Req() req: express.Request,
    @Res() res: express.Response,
  ) {
    console.log('📦 Full body:', JSON.stringify(body));
    console.log('📦 thirdPartyId:', body.thirdPartyId);
    console.log('📦 oAuthTokens:', body.oAuthTokens);
    const response = await this.thirdPartyService.signInUp(
      body.thirdPartyId,
      body.oAuthTokens,
    );

    if (response.status === 'OK' &&  !!response.recipeUserId  ) {
      await Session.createNewSession(req, res, 'public', response.recipeUserId );
      return res.json({ status: 'OK' });
    }

    return response;
  }
}