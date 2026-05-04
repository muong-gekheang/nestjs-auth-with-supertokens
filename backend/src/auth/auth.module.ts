import { Module, OnModuleInit } from "@nestjs/common";
import { RoleServiceModule } from "src/common/role/role.module";
import { TelegramGatewayModule } from "src/common/telegram-gateway/telegram-gateway.module";
import { UserSyncServiceModule } from "src/common/user-sync/user-sync.module";
import { EmailController } from "./email/email-password.controller";
import { PhoneAuthController } from "./phone/phone-auth.controller";
import { SessionController } from "./session/session.controller";
import { EmailPasswordService } from "./email/email-password.service";
import { EmailPasswordHelper } from "./email/email-password.helper";
import { EmailPasswordAuthService } from "./email/email-password-auth.service";
import { PhoneAuthService } from "./phone/phone-auth.service";
import { SessionService } from "./session/session.service";
import { ThirdPartyHelper } from "./third-party/third-party.helper";
import { initSuperTokens } from "./config/super-tokens";
import { ThirdPartyController } from "./third-party/third-party.controller";
import { ThirdPartyService } from "./third-party/third-party.service";


@Module({
  imports: [
    TelegramGatewayModule,
    UserSyncServiceModule,
    RoleServiceModule,
  ],
  controllers: [
    EmailController,
    PhoneAuthController,
    SessionController,
    ThirdPartyController
  ],
  providers: [
    EmailPasswordAuthService,
    EmailPasswordService,
    EmailPasswordHelper,
    PhoneAuthService,
    SessionService,
    ThirdPartyHelper,
    ThirdPartyService
  ],
})

export class AuthModule implements OnModuleInit {
  constructor(
    private readonly emailPasswordHelper: EmailPasswordHelper,
    private readonly thirdPartyHelper: ThirdPartyHelper,
  ) {}

  onModuleInit() {
    initSuperTokens(
      this.emailPasswordHelper,
      this.thirdPartyHelper,
    );
  }
}


