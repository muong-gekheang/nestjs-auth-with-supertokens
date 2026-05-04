// app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { RoleBasedPermissionModule } from './role-based-permission/role-based-permission.module';
import { AuthModule } from './auth/auth.module';
import { RolesGuard } from './auth/role.guard';
import { APP_GUARD } from '@nestjs/core';
import { SessionGuard } from './auth/session.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGO_DB!),
    RoleBasedPermissionModule,
    AuthModule,
  ],

})
export class AppModule {}