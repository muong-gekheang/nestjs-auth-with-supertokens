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

@Injectable()
export class SuperTokensService {
  private requestIdStore: Record<string, string> = {};
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {
    this.init();
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
                  const res = await fetch('https://gatewayapi.telegram.org/sendVerificationMessage', {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${process.env.TELEGRAM_GATEWAY_TOKEN!}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      phone_number: input.phoneNumber,
                      ttl: 60,
                    }),
                  });
                  const data = await res.json();
                  if (!data.ok) {
                    throw new Error(`Telegram Gateway error: ${data.error}`);
                  }
                  this.requestIdStore[input.phoneNumber] = data.result.request_id;
                }
              },
            },
            override: {
              functions: (originalImplementation) => ({
                ...originalImplementation,
          
                consumeCode: async (input) => {
                  const response =
                    await originalImplementation.consumeCode(input);
          
                  if (response.status === "OK") {
                    await this.syncUser(
                      response.user.id,
                      undefined,
                      response.user.phoneNumbers[0],
                    );
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
