import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Model } from 'mongoose';
import Dashboard from "supertokens-node/recipe/dashboard";
import SuperTokens from "supertokens-node";
import Session from "supertokens-node/recipe/session";
import EmailPassword from "supertokens-node/recipe/emailpassword";
import ThirdParty from "supertokens-node/recipe/thirdparty";
import UserRoles from "supertokens-node/recipe/userroles";
import Passwordless from "supertokens-node/recipe/passwordless";
import * as bcrypt from 'bcrypt'
import * as https from 'https';
import * as crypto from 'crypto';
import EmailVerification from 'supertokens-node/recipe/emailverification';
import { sendEmail } from '../super-tokens/resend-service';
@Injectable()
export class SuperTokensService {

  private pendingSignups: Record<string, {
    email: string;
    password: string;
    expiresAt: number;
  }> = {};

  private requestIdStore: Record<string, {
    requestId: string;
    preAuthSessionId: string
    userInputCode: string;
  }> = {};
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {
    this.init();
  }


  private telegramRequest(endpoint: string, body: object): Promise<any> {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify(body);

      const options = {
        hostname: 'gatewayapi.telegram.org',
        path: `/${endpoint}`,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.TELEGRAM_GATEWAY_TOKEN!}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      };

      const req = https.request(options, (res) => {
        let responseData = '';
        res.on('data', (chunk) => responseData += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(responseData));
          } catch (e) {
            reject(new Error('Failed to parse Telegram response'));
          }
        });
      });

      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }

  private async syncUser(userId: string, email?: string, phone?: string) {
    let user = await this.userModel.findOne({ superTokensUserId: userId });
    let role = "User";

    if (email?.endsWith("@admin.com")) {
      role = "Admin";
    }

    if (!user) {
      await this.userModel.create({
        superTokensUserId: userId,
        emails: email ? [email] : [],
        phoneNumbers: phone ? [phone] : [],
      });

      const result = await UserRoles.addRoleToUser("public", userId, role);
      console.log("Role assignment result:", result);
      return;
    }

    if (email && !user.emails.includes(email)) user.emails.push(email);
    if (phone && !user.phoneNumbers.includes(phone)) user.phoneNumbers.push(phone);
    
    await user.save();
  }


  init() {
    SuperTokens.init({
      framework: "express",
      supertokens: {
        connectionURI: "http://localhost:3567",
      },
      appInfo: {
        appName: "auth-super-token",
        apiDomain: "http://localhost:3000",
        websiteDomain: "http://localhost:3001",
        apiBasePath: "/auth",
        websiteBasePath: "/auth",
      },
      recipeList: [
        // TELEGRAM (OTP)
        Passwordless.init({
          flowType: "USER_INPUT_CODE",
          contactMethod: "PHONE",
          smsDelivery: {
            service: {
              sendSms: async (input) => {
                console.log('Sending to:', input.phoneNumber);
                console.log('Token exists:', !!process.env.TELEGRAM_GATEWAY_TOKEN);
                if (process.env.MOCK_OTP === 'true') {
                  console.log(`[MOCK OTP] Phone: ${input.phoneNumber}, OTP: ${input.userInputCode}`)
                  this.requestIdStore[input.phoneNumber] = {
                    requestId: 'mock-request-id',
                    preAuthSessionId: input.preAuthSessionId,
                    userInputCode: input.userInputCode ?? '',
                  }
                  return
                }
            
                const data = await this.telegramRequest('sendVerificationMessage', {
                  phone_number: input.phoneNumber,
                  ttl: 60,
                  code_length: 4,
                });
                
                console.log('Telegram send response:', data);
                
                if (!data.ok) {
                  throw new Error(`Telegram Gateway error: ${data.error}`);
                }
                
                this.requestIdStore[input.phoneNumber] = {
                  requestId: data.result.request_id,
                  preAuthSessionId: input.preAuthSessionId,
                  userInputCode: input.userInputCode ?? '',
                };
              }
            },
          },
          override: {
            functions: (originalImplementation) => ({
              ...originalImplementation,
          
              consumeCode: async (input) => {
                console.log('consumeCode userInputCode:', (input as any).userInputCode);
                console.log('consumeCode preAuthSessionId:', (input as any).preAuthSessionId);

                // get phone from preAuthSessionId lookup or directly
                const phone = (input as any).phoneNumber
                  ?? Object.keys(this.requestIdStore).find(
                    p => this.requestIdStore[p].preAuthSessionId === (input as any).preAuthSessionId
                  );
          
                const stored = phone ? this.requestIdStore[phone] : undefined;
                const requestId = stored?.requestId;

                if (process.env.MOCK_OTP === 'true') {
                  // skip Telegram verification, just let SuperTokens handle it
                  const response = await originalImplementation.consumeCode(input)
                
                  if (response.status === 'OK') {
                    await this.syncUser(
                      response.user.id,
                      undefined,
                      response.user.phoneNumbers[0],
                    )
                    if (phone) delete this.requestIdStore[phone]
                  }
                
                  return response
                }
          
                if (!requestId) {
                  return { status: "RESTART_FLOW_ERROR" };
                }
          
                console.log('phone found:', phone);
                console.log('requestIdStore:', this.requestIdStore);
                console.log('requestId:', phone ? this.requestIdStore[phone] : 'NOT FOUND');
                
                // 2. verify with Telegram Gateway instead of SuperTokens
                const verifyData = await this.telegramRequest('checkVerificationStatus', {
                  request_id: requestId,
                  code: (input as any).userInputCode,
                });
          
                console.log('Telegram verify response:', verifyData);
                const status = verifyData?.result?.verification_status?.status;
          
                if (status !== 'code_valid') {
                  return {
                    status: "INCORRECT_USER_INPUT_CODE_ERROR",
                    maximumCodeInputAttempts: 5,
                    failedCodeInputAttemptCount: 1,
                  };
                }
          
                // 3. Telegram verified ✅ — let SuperTokens create the session
                const response = await originalImplementation.consumeCode({
                  ...input,
                  userInputCode: stored.userInputCode, // 👈 swap with SuperTokens' own code
                });
          
                if (response.status === "OK") {
                  await this.syncUser(
                    response.user.id,
                    undefined,
                    response.user.phoneNumbers[0],
                  );
          
                  // cleanup
                  if (phone) delete this.requestIdStore[phone];
                }
          
                return response;
              },
            }),
          },
        }),

        // EMAIL + PASSWORD
        EmailPassword.init({
          emailDelivery: {
            override: (originalImplementation) => ({
              ...originalImplementation,
              sendEmail: async (input) => {
                console.log('EMAIL FUNCTION TRIGGERED');
                if (input.type === 'PASSWORD_RESET') {
                  await sendEmail(
                    input.user.email,
                    'Reset your password',
                    `
                      <h2>Reset your password</h2>
                      <p>Click the link below to reset your password. This link expires in 1 hour.</p>
                      <a href="${input.passwordResetLink}">Reset Password</a>
                      <p>If you didn't request this, please ignore this email.</p>
                    `
                  )
                }
              }
            }),
          },
          override: {
            functions: (originalImplementation) => ({
              ...originalImplementation,
    
              signUp: async (input) => {
                const response = await originalImplementation.signUp(input);
    
                if (response.status === "OK") {
                  await this.syncUser(response.user.id, input.email, undefined);

                  await EmailVerification.sendEmailVerificationEmail(
                    "public",
                    response.user.id,
                    response.recipeUserId,
                  );
                }
                return response;
              },
    
              signIn: async (input) => {
                const response = await originalImplementation.signIn(input);
    
                if (response.status === "OK") {
                  await this.syncUser(response.user.id, input.email, undefined);
                }
    
                return response;
              },
            }),
          },
        }),
        
        EmailVerification.init({
          mode: 'REQUIRED',
          emailDelivery: {
            override: (originalImplementation) => ({
              ...originalImplementation,
              sendEmail: async (input) => {
                await sendEmail(
                  input.user.email,
                  'verify your email',
                  `
                    <h2>Verify your email address</h2>
                    <p>Click the link below to verify your email. This link expires in 24 hours.</p>
                    <a href="${input.emailVerifyLink}">Verify Email</a>
                    <p>If you didn't create an account, please ignore this email.</p>
                  `
                )
              }
            })
          }
        }),
        // 🔹 GOOGLE / THIRD PARTY
        ThirdParty.init({
          signInAndUpFeature: {
            providers: [
              {
                config: {
                  thirdPartyId: "google",
                  clients: [
                    {
                      clientId: process.env.GOOGLE_CLIENT_ID!,
                      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
                    },
                  ],
                },
              },
            ],
          },
          override: {
            functions: (originalImplementation) => ({
              ...originalImplementation,
    
              signInUp: async (input) => {
                const response =
                  await originalImplementation.signInUp(input);
    
                if (response.status === "OK") {
                  const email = response.user.emails[0];
                  await this.syncUser(response.user.id, email, undefined);
                }
    
                return response;
              },
            }),
          },
        }),
    
        Dashboard.init(),
        Session.init({}),
        UserRoles.init(),
      ],
    });
  }

  async signup(email: string, password: string) {
    const response = await EmailPassword.signUp('public', email, password);
  
    if (response.status !== 'OK') {
      return {
        status: 'ERROR',
        message: 'Email already exists or invalid input',
      };
    }
  
    // optional: sync DB
    await this.syncUser(response.user.id, email);
  
    // optional: send verification email (SuperTokens way)
    await EmailVerification.sendEmailVerificationEmail(
      'public',
      response.user.id,
      response.recipeUserId,
    );
  
    return {
      status: 'OK',
      userId: response.user.id,
    };
  }

  async phoneSignUp(phone: string, password: string) {
    const existingUser = await this.userModel.findOne({ phoneNumbers: phone });
    if (!existingUser) {
      return { status: 'ERROR', message: 'Phone not verified yet' };
    }
    
    if (existingUser.phonePassword) {
      return { status: 'ERROR', message: 'This password has already used. Please use another one' };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    existingUser.phonePassword = hashedPassword;
    await existingUser.save();
    return { status: 'OK' };
  }

  async phoneSignIn(phone: string, password: string) {
    console.log('phoneSignIn called', phone)
    const user = await this.userModel.findOne({ phoneNumbers: phone })
    console.log('user found:', user)
    if (!user || !user.phonePassword) {
      return { status: 'ERROR', message: 'Invalid phone or password' }
    }

    const isMatch = await bcrypt.compare(password, user.phonePassword)
    console.log('isMatch:', isMatch)
    if (!isMatch) {
      return { status: 'ERROR', message: 'Invalid phone or password' }
    }
  
    return {
      status: 'OK',
      superTokensUserId: user.superTokensUserId
    }
  }

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
    const users = await SuperTokens.listUsersByAccountInfo('public', { email },)
    if (users.length === 0) {
      return { status: 'ERROR', message: 'No account found with this email' };
    }
    const userId = users[0].id;

    const token = await EmailPassword.createResetPasswordToken(
      'public',
      userId,
      email,
    );

    if (token.status === 'UNKNOWN_USER_ID_ERROR') {
      return { status: 'ERROR', message: 'No account found with this email' };
    }

    return {
      status: 'OK',
      message: 'Password reset email sent',
      token: token.token 
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const response = await EmailPassword.resetPasswordUsingToken(
      'public',
      token,
      newPassword,
    );
    if (response.status == "RESET_PASSWORD_INVALID_TOKEN_ERROR") {
      return { status: 'ERROR', message: 'Invalid or expired token' };
    }
    return { status: 'OK', message: 'Password reset successful' };
  }

  async verifyEmail(token: string) {
    const response = await EmailVerification.verifyEmailUsingToken(
      'public',
      token,
    );

    if (response.status === 'EMAIL_VERIFICATION_INVALID_TOKEN_ERROR') {
      return { status: 'ERROR', message: 'Invalid or expired token' };
    }

    return { status: 'OK', message: 'Email verified successfully' };
  }

  async sendMagicLink(email: string, password: string) {
    const token = crypto.randomBytes(32).toString('hex');


    this.pendingSignups[token] = {
      email,
      password,
      expiresAt: Date.now() + 15 * 60 * 1000, // 15 minutes
    };

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
    );
  
    return { status: 'OK', message: 'Magic link sent to your email' };
  }

  async verifyMagicLinkAndSignup(token: string) {
    const pending = this.pendingSignups[token];
  
    if (!pending) {
      return { status: 'ERROR', message: 'Invalid or expired link' };
    }
  
    if (Date.now() > pending.expiresAt) {
      delete this.pendingSignups[token];
      return { status: 'ERROR', message: 'Link has expired, please request a new one' };
    }
  
    // Email verified ✅ → now create the account
    const result = await EmailPassword.signUp('public', pending.email, pending.password);
  
    if (result.status === 'OK') {
      // Mark email as verified since they already clicked the magic link
      const tokenResponse = await EmailVerification.createEmailVerificationToken(
        'public',
        result.recipeUserId,
        pending.email,
      );
        
      if (tokenResponse.status === 'OK') {
        await EmailVerification.verifyEmailUsingToken('public', tokenResponse.token);
      }

      const updatedUser = await SuperTokens.getUser(result.user.id);
      return { status: 'OK', user: updatedUser };
    }

    delete this.pendingSignups[token];
    return result;
  }
}
