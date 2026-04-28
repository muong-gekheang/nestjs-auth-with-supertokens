import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CreateSuperTokenDto } from './dto/create-super-token.dto';
import { UpdateSuperTokenDto } from './dto/update-super-token.dto';
import { User, UserDocument } from './schemas/user.schema';
import { Model } from 'mongoose';
import Dashboard from "supertokens-node/recipe/dashboard";
import SuperTokens from "supertokens-node";
import Session from "supertokens-node/recipe/session";
import EmailPassword from "supertokens-node/recipe/emailpassword";
import ThirdParty from "supertokens-node/recipe/thirdparty";
import UserRoles from "supertokens-node/recipe/userroles";
import Passwordless from "supertokens-node/recipe/passwordless";
import * as https from 'https';
@Injectable()
export class SuperTokensService {
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

      const result =  await UserRoles.addRoleToUser("public", userId, role);
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
          // 🔹 TELEGRAM (OTP)
          Passwordless.init({
            flowType: "USER_INPUT_CODE",
            contactMethod: "PHONE",
            smsDelivery: {
              service: {
                sendSms: async (input) => {
                  console.log('Sending to:', input.phoneNumber);
                  console.log('Token exists:', !!process.env.TELEGRAM_GATEWAY_TOKEN);
                  
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

          // 🔹 EMAIL + PASSWORD
          EmailPassword.init({
            override: {
              functions: (originalImplementation) => ({
                ...originalImplementation,
    
                signUp: async (input) => {
                  const response = await originalImplementation.signUp(input);
    
                  if (response.status === "OK") {
                    await this.syncUser(response.user.id, input.email, undefined);
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
          Session.init({

          }),
          UserRoles.init(),
        ],
      });
  }
}
