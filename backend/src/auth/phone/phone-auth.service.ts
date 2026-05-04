import SuperTokens  from 'supertokens-node';
import { UserSyncService } from '../../common/user-sync/user-sync.service';
import EmailVerification  from 'supertokens-node/recipe/emailverification';
import { Injectable } from '@nestjs/common';
import * as https from 'https';
import { TelegramGatewayService } from 'src/common/telegram-gateway/telegram-gateway.service';
import EmailPassword from 'supertokens-node/recipe/emailpassword'
import { RoleService } from 'src/common/role/role.service';

@Injectable()
export class PhoneAuthService {
  private readonly MOCK_OTP = '0000';
  constructor(
    private readonly telegramGatewayService: TelegramGatewayService,
    private readonly userSyncService: UserSyncService,
    private readonly roleService: RoleService,
  ) { }

  async sendOtp(phone: string) {
    if (process.env.MOCK_OTP === 'true') {
      console.log(`[MOCK OTP] Phone: ${phone}, use code: ${this.MOCK_OTP}`);
      return { status: 'OK' };
    }
    try {
      await this.telegramGatewayService.getOTP(phone);
      return { status: 'OK' };
    } catch (error) {
      return { status: 'ERROR', message: error.message };
    }
  }

  async verifyOtpAndSignup(phone: string, password: string, otp: string) {
    const verifyResult = await this.verifyOtp(phone, otp);
    if (verifyResult.status !== 'OK') return verifyResult;
    return await this.signUp(phone, password);

  }

  async resetPassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await SuperTokens.getUser(userId);
    if (!user) {
      return { status: 'ERROR', message: 'User not found' };
    }

    const email = user.emails[0];

    const verifyResult = await EmailPassword.signIn('public', email, oldPassword);
    if (verifyResult.status !== 'OK') {
      return { status: 'ERROR', message: 'Old password is incorrect' };
    }

    const updateResult = await EmailPassword.updateEmailOrPassword({
      recipeUserId: verifyResult.recipeUserId,
      password: newPassword,
    });

    if (updateResult.status !== 'OK') {
      return { status: 'ERROR', message: 'Failed to update password' };
    }
  
    return { status: 'OK', message: 'Password updated successfully' };
  }

  async sendForgotPasswordOtp(phone: string) {
    const digits = phone.replace(/\D/g, '');
    const email = `${digits}@phone.com`;
  
    const users = await SuperTokens.listUsersByAccountInfo('public', { email });
    if (users.length === 0) {
      return { status: 'ERROR', message: 'No account found with this phone' };
    }
  
    return this.sendOtp(phone);
  }

  async forgotPassword(phone: string, otp: string, newPassword: string) {
    const verifyResult = await this.verifyOtp(phone, otp);
    if (verifyResult.status !== 'OK') {
      return { status: 'ERROR', message: 'Invalid OTP' };
    }

    const digits = phone.replace(/\D/g, '');
    const email = `${digits}@phone.com`;

    const users = await SuperTokens.listUsersByAccountInfo('public', { email });
    if (users.length === 0) {
      return { status: 'ERROR', message: 'No account found with this phone' };
    }

    const loginMethod = users[0].loginMethods.find(m => m.recipeId === 'emailpassword');
    if (!loginMethod) {
      return { status: 'ERROR', message: 'No email/password login found' };
    }

    const updateResult = await EmailPassword.updateEmailOrPassword({
      recipeUserId: loginMethod.recipeUserId,
      password: newPassword,
    });

    if (updateResult.status !== 'OK') {
      return { status: 'ERROR', message: 'Failed to update password' };
    }

    // ✅ Step 4: Clear OTP
    this.telegramGatewayService.clear(phone);

    return { status: 'OK', message: 'Password reset successfully' };
  }
  
  private async verifyOtp(phone: string, otp: string) {
    if (process.env.MOCK_OTP === 'true') {
      if (otp !== this.MOCK_OTP) {
        return { status: 'ERROR', message: 'Invalid OTP' };
      }
      return { status: 'OK' };
    } else {
      const verifyResult = await this.telegramGatewayService.verifyOTP(phone, otp);
      if (verifyResult.status !== 'OK') {
        return { status: 'ERROR', message: 'Invalid OTP' };
      }
      return { status: 'OK' };
    }
  }

  private async signUp(phone: string, password: string) {
    const digits = phone.replace(/\D/g, '');
    const email = `${digits}@phone.com`;

    const result = await EmailPassword.signUp('public', email, password);

    if (result.status !== 'OK') {
      return { status: 'ERROR', message: 'Failed to create account' };
    }

    const tokenResponse = await EmailVerification.createEmailVerificationToken('public', result.recipeUserId, email);
    if (tokenResponse.status === 'OK') {
      await EmailVerification.verifyEmailUsingToken('public', tokenResponse.token);
    }
    await this.userSyncService.syncUser(result.user.id, email, undefined);
    await this.roleService.assignRole(result.user.id, 'User');
    this.telegramGatewayService.clear(phone);

    const updatedUser = await SuperTokens.getUser(result.user.id);
    return { status: 'OK', user: updatedUser };
  }
  async signIn(phone: string, password: string) {
    const digits = phone.replace(/\D/g, '');
    const email = `${digits}@phone.com`;
    const response = await EmailPassword.signIn('public', email, password);

    if (response.status !== 'OK') {
      return { status: 'ERROR', message: 'Invalid phone or password' };
    }

    return {
      status: 'OK',
      recipeUserId: response.user.loginMethods[0].recipeUserId,
    };
  }
}