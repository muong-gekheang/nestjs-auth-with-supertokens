// app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { SupertokensModule } from './super-tokens/super-tokens.module';
import { RoleBasedPermissionModule } from './role-based-permission/role-based-permission.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGO_DB!),
    SupertokensModule.forRoot(),
    RoleBasedPermissionModule, 
  ],
})
export class AppModule {}