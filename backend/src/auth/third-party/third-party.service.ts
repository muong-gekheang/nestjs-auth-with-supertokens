// third-party.service.ts
import ThirdParty from 'supertokens-node/recipe/thirdparty';
import { Injectable } from "@nestjs/common";
import { RecipeUserId } from 'supertokens-node';
import { UserSyncService } from 'src/common/user-sync/user-sync.service';
import { RoleService } from 'src/common/role/role.service';

@Injectable()
export class ThirdPartyService {
  constructor(
    private readonly userSyncService: UserSyncService,
    private readonly roleService: RoleService,
  ) {}

  async getAuthorisationUrl(provider: string, redirectURIOnProviderDashboard: string) {
    const providerInfo = await ThirdParty.getProvider('public', provider, undefined);

    if (!providerInfo) {
      return { status: 'ERROR', message: 'Provider not found' };
    }

    const response = await providerInfo.getAuthorisationRedirectURL({
      tenantId: 'public',
      redirectURIOnProviderDashboard,
    });

    return { status: 'OK', url: response.urlWithQueryParams };
  }

  async signInUp(thirdPartyId: string, oAuthTokens: any) {
    const providerInfo = await ThirdParty.getProvider('public', thirdPartyId, undefined);
  
    if (!providerInfo) {
      return { status: 'ERROR', message: 'Provider not found' };
    }
  
    // ✅ Get user info from Google
    const userInfo = await providerInfo.getUserInfo({
      tenantId: 'public',
      oAuthTokens,
      accessToken: oAuthTokens.access_token,
    });

    console.log('✅ [ThirdPartyService] userInfo:', userInfo);
    console.log('✅ [ThirdPartyService] thirdPartyUserId:', userInfo.thirdPartyUserId);
    console.log('✅ [ThirdPartyService] email:', userInfo.email);
  
    // ✅ Create or update user
    const user: any = await ThirdParty.manuallyCreateOrUpdateUser(
      'public',
      thirdPartyId,
      userInfo.thirdPartyUserId,
      userInfo.email?.id!,
      true,
    );

    console.log('✅ [ThirdPartyService] user:', user);
    console.log('✅ [ThirdPartyService] createdNewRecipeUser:', user.createdNewRecipeUser);

    if (user.createdNewRecipeUser) {
      const email = userInfo.email?.id!;
      console.log('🆕 [ThirdPartyService] New user — syncing and assigning role...');
      try {
        await this.userSyncService.syncUser(user.user.id, email, undefined);
        console.log('✅ [ThirdPartyService] User synced');
      } catch (e) {
        console.log('❌ [ThirdPartyService] Sync failed:', e.message);
      }
      try {
        await this.roleService.assignRole(user.user.id, 'User');
        console.log('✅ [ThirdPartyService] Role assigned');
      } catch (e) {
        console.log('❌ [ThirdPartyService] Role assignment failed:', e.message);
      }

      // await this.userSyncService.syncUser(user.user.id, email, undefined);
      // await this.roleService.assignRole(user.user.id, 'User');
    }else {
      console.log('👤 [ThirdPartyService] Existing user, skipping sync and role assignment');
    }
  
    return { status: 'OK', recipeUserId: user.recipeUserId };
  }
}