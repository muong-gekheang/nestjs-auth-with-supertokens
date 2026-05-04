import SuperTokens from 'supertokens-node';
import EmailVerification from 'supertokens-node/recipe/emailverification';
import EmailPassword  from 'supertokens-node/recipe/emailpassword';
import { Injectable } from "@nestjs/common";
import { sendEmail } from "./resend-service";
import * as crypto from 'crypto';
import { UserSyncService } from 'src/common/user-sync/user-sync.service';
import { RoleService } from 'src/common/role/role.service';

@Injectable()
export class EmailPasswordAuthService{
  private pendingSignUps: Record<string, {
    email: string;
    password: string;
    expiresAt: number;
  }> = {}; 

  constructor(
    private readonly userSyncService: UserSyncService,
    private readonly roleService: RoleService,
  ) {}

  async sendMagicLink(email: string, password: string) {
    const token = crypto.randomBytes(32).toString('hex');
    this.pendingSignUps[token] = {
      email,
      password,
      expiresAt: Date.now() + 15 * 60 * 1000, // 15 minutes
    }

    const magicLink = `${process.env.WEBSITE_DOMAIN}/auth/verify-signup?token=${token}`;
    
    await sendEmail(
      email,
      'Verify your email to complete signup',
      `
        <h2>Almost there!</h2>
        <p>Click the link below to complete your signup. Expires in 15 minutes.</p>
        <a href="${magicLink}">Complete Signup</a>
        <p>If you didn't request this, please ignore this email.</p>
      `
    )
  }

  async verifyMagicLinkAndSignUp(token: string) {
    const pending = this.pendingSignUps[token];
    if (!pending) {
      return { status: 'ERROR', message: 'Invalid or expired link' };
    }
    if (Date.now() > pending.expiresAt) {
      delete this.pendingSignUps[token];
      return { status: 'ERROR', message: 'Link has expired, please request a new one' };
    }
    const result = await EmailPassword.signUp('public', pending.email, pending.password);
    if (result.status !== 'OK') {
      return result;
    }

    const tokenResponse = await EmailVerification.createEmailVerificationToken(
      'public',
      result.recipeUserId,
      pending.email,
    );

    if (tokenResponse.status === 'OK') {
      await EmailVerification.verifyEmailUsingToken('public', tokenResponse.token);
    }

    await this.userSyncService.syncUser(result.user.id, pending.email);
    await this.roleService.assignRole(result.user.id, 'user');

    delete this.pendingSignUps[token]; 

    const updateUser = await SuperTokens.getUser(result.user.id);
    return { status: 'OK', user: updateUser };
  }

}