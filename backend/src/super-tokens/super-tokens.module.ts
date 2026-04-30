import { Module, DynamicModule } from '@nestjs/common';
import { InjectModel, MongooseModule } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserSchema } from './schemas/user.schema';
import { SuperTokensService } from '../super-tokens/super-tokens.service';
import { SuperTokensController } from './super-tokens.controller';
import { TelegramGatewayModule } from 'src/common/telegram-gateway.service';
import { UserSyncServiceModule } from 'src/common/user-sync.service';


@Module({})
export class SupertokensModule {
  static forRoot(): DynamicModule {
    return {
      module: SupertokensModule,
      imports: [
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
        TelegramGatewayModule,
        UserSyncServiceModule,
      ],
      controllers: [SuperTokensController], 
      providers: [SuperTokensService],
      exports: [SuperTokensService],
    };
  }
}