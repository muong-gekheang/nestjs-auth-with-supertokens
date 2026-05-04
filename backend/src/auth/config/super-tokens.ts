import  UserRoles from 'supertokens-node/recipe/userroles';
import  Session  from 'supertokens-node/recipe/session';
import Dashboard from 'supertokens-node/recipe/dashboard';
import { ThirdPartyHelper } from '../third-party/third-party.helper';
import { EmailPasswordHelper } from '../email/email-password.helper';
import SuperTokens from "supertokens-node";
import { buildEmailPasswordRecipe } from '../email/email-password.recipe';
import { buildEmailVerificationRecipe } from '../email-verification/email-verification.recipe';
import { buildThirdPartyRecipe } from '../third-party/third-party.recipe';


let isInitialized = false;
export function initSuperTokens(
  // passwordlessHelper: PasswordlessHelper,
  emailPasswordHelper: EmailPasswordHelper,
  thirdPartyHelper: ThirdPartyHelper,
): void {
  if (isInitialized) return;
  isInitialized = true;
  SuperTokens.init({
    framework: "express",
    supertokens: {
      connectionURI: "http://localhost:3567",
    },
    appInfo: {
      appName: "auth-super-token",
      apiDomain: "http://localhost:3000",
      websiteDomain: "http://localhost:3001",
      apiBasePath: "/auth/st",
      websiteBasePath: "/auth",
    },
    recipeList: [
      // buildPasswordlessRecipe(passwordlessHelper),
      buildEmailPasswordRecipe(emailPasswordHelper),
      buildEmailVerificationRecipe(),
      buildThirdPartyRecipe(thirdPartyHelper),
      Dashboard.init(),
      Session.init({
        cookieDomain: "localhost",
        cookieSecure: false,
        cookieSameSite: "lax",
        getTokenTransferMethod: () => "cookie",
      }),
      UserRoles.init(),
    ],
  })
}