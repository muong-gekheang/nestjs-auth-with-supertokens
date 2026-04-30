import { Module } from '@nestjs/common';
import { PhoneAuthService } from './phone-auth.service';
import { PhoneAuthController } from './phone-auth.controller';

@Module({
  controllers: [PhoneAuthController],
  providers: [PhoneAuthService],
})
export class PhoneAuthModule {}
