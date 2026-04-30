import UserRoles  from 'supertokens-node/recipe/userroles';
import { Injectable, Module } from "@nestjs/common";

@Injectable()
export class RoleService{
  async assignRole(userId: string, role: string) {
    return await UserRoles.addRoleToUser(
      "public",
      userId,
      role
    );
  }

  async removeRole(userId: string, role: string) {
    return await UserRoles.removeUserRole(
      "public",
      userId,
      role
    );
  }

  async getRoles(userId: string) {
    return await UserRoles.getRolesForUser("public", userId);
  }
}

@Module({
  providers: [RoleService],
  exports: [RoleService],
})
export class RoleServiceModule {}