import { Injectable } from '@nestjs/common';
import SuperTokens from 'supertokens-node';
import EmailPassword from 'supertokens-node/recipe/emailpassword';
import EmailVerification from 'supertokens-node/recipe/emailverification';
import { sendEmail } from './resend-service';

@Injectable()
export class EmailPasswordService { 
  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await SuperTokens.getUser(userId);
    const email = user?.emails[0];

    if (!email) {
      return { status: 'ERROR', message: 'User not found' };
    }
    const signInResult = await EmailPassword.signIn('public', email, oldPassword);
    if (signInResult.status !== 'OK') {
      return { status: 'ERROR', message: 'Current password is incorrect' };
    }

    const result = await EmailPassword.updateEmailOrPassword({
      recipeUserId: signInResult.recipeUserId,
      password: newPassword,
    });

    if (result.status !== 'OK') {
      return { status: 'ERROR', message: 'Failed to change password' };
    }

    return { status: 'OK', message: 'Password changed successfully' };
  }

  async forgotPassword(email: string) {
    const users = await SuperTokens.listUsersByAccountInfo('public', { email });

    if (users.length === 0) {
      return { status: 'ERROR', message: 'No account found with this email' };
    }

    const token = await EmailPassword.createResetPasswordToken(
      'public',
      users[0].id,
      email,
    );

    if (token.status === 'UNKNOWN_USER_ID_ERROR') {
      return { status: 'ERROR', message: 'No account found with this email' };
    }

    const resetLink = `http://localhost:3000/auth/email/reset-password-form?token=${token.token}`;
    await sendEmail(
      email,
      "Reset your password",
      `
        <h2>Reset your password</h2>
        <p>Click the link below to reset your password. This link expires in 1 hour.</p>
        <a href="${resetLink}">Reset Password</a>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    );
  

    return { status: 'OK', message: 'Password reset email sent' };
  }

  async resetPassword(token: string, newPassword: string) {
    const response = await EmailPassword.resetPasswordUsingToken(
      'public',
      token,
      newPassword,
    );

    if (response.status === 'RESET_PASSWORD_INVALID_TOKEN_ERROR') {
      return { status: 'ERROR', message: 'Invalid or expired token' };
    }

    return { status: 'OK', message: 'Password reset successful' };
  }

}