import ThirdParty  from 'supertokens-node/recipe/thirdparty';
import { ThirdPartyHelper } from "./third-party.helper";

export function buildThirdPartyRecipe(helper: ThirdPartyHelper) {
  return ThirdParty.init({
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
        signInUp: (input) => helper.handleSignInUp(input, originalImplementation),
      })
    }

  })
}