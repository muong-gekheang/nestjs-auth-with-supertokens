import { Module } from '@nestjs/common';
import { RoleBasedPermissionService } from './role-based-permission.service';
import { RoleBasedPermissionController } from './role-based-permission.controller';

@Module({
  controllers: [RoleBasedPermissionController],
  providers: [RoleBasedPermissionService],
})
export class RoleBasedPermissionModule {}
