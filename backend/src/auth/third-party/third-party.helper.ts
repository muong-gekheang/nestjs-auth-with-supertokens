import { Injectable } from "@nestjs/common";
import { RoleService } from "src/common/role/role.service";
import { UserSyncService } from "src/common/user-sync/user-sync.service";

@Injectable()
export class ThirdPartyHelper {
  constructor(
    private readonly userSyncService: UserSyncService,
    private readonly roleService: RoleService,
  ) {}

  async handleSignInUp(input: any, originalImplementation: any) {
    const response = await originalImplementation.signInUp(input);

    if (response.status === "OK" && response.createdNewRecipeUser) {
      const email = response.user.emails[0];
      await this.userSyncService.syncUser(response.user.id, email, undefined);
      await this.roleService.assignRole(response.user.id, "User");
    }

    return response;
  }
}