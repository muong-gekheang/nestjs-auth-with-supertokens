import { UserSyncService } from 'src/common/user-sync/user-sync.service';
import { Injectable } from "@nestjs/common";
import { sendEmail } from './resend-service';
import { RecipeInterface } from "supertokens-node/recipe/emailpassword";
import { RoleService } from 'src/common/role/role.service';


@Injectable()
export class EmailPasswordHelper {

  constructor(
    private readonly userSyncService: UserSyncService,
    private readonly roleService: RoleService,
  ) { }
  
  async handleResetPassword(input: any): Promise<void> {
    await sendEmail(
      input.user.email,
      "Reset your password",
      `
        <h2>Reset your password</h2>
        <p>Click the link below to reset your password. This link expires in 1 hour.</p>
        <a href="${input.passwordResetLink}">Reset Password</a>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    );
  }

  async handleSignUp(input: any, originalImplementation: RecipeInterface): Promise<any>{
    const response = await originalImplementation.signUp(input);

    if (response.status === "OK") {
      await this.userSyncService.syncUser(response.user.id, input.email, undefined);
      await this.roleService.assignRole(response.user.id, "User");
    }
    return response;
  }

  async handleSignIn(input: any, originalImplementation: RecipeInterface): Promise<any>{
    const response = await originalImplementation.signIn(input);
    return response;
  }
}