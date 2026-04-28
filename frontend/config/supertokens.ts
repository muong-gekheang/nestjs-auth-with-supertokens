import SuperTokens from "supertokens-auth-react";
import Session from "supertokens-auth-react/recipe/session";
import ThirdParty, { Google } from "supertokens-auth-react/recipe/thirdparty";

SuperTokens.init({
  appInfo: {
    appName: "My App",
    apiDomain: "http://localhost:3000",
    websiteDomain: "http://localhost:3001",
    apiBasePath: "/auth",
    websiteBasePath: "/auth",
  },

  recipeList: [
    Session.init(),
    ThirdParty.init({
      signInAndUpFeature: {
        providers: [Google.init()],
      },
    }),
  ],
});