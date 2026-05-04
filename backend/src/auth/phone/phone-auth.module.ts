import { Module } from '@nestjs/common';
import { PhoneAuthService } from './phone-auth.service';
import { PhoneAuthController } from './phone-auth.controller';
import { TelegramGatewayModule } from 'src/common/telegram-gateway/telegram-gateway.module';
import { UserSyncServiceModule } from 'src/common/user-sync/user-sync.module';
import { RoleServiceModule } from 'src/common/role/role.module';

@Module({
  imports: [
    TelegramGatewayModule,
    UserSyncServiceModule,
    RoleServiceModule,
  ],
  controllers: [PhoneAuthController],
  providers: [PhoneAuthService],
})
export class PhoneAuthModule {}
