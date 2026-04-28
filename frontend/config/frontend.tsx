import ThirdParty, { Google, Github } from 'supertokens-auth-react/recipe/thirdparty'
import SessionReact from 'supertokens-auth-react/recipe/session'
import { appInfo } from './appInfo'
import { useRouter } from 'next/navigation'
import { SuperTokensConfig } from 'supertokens-auth-react/lib/build/types'
import EmailPassword from 'supertokens-auth-react/recipe/emailpassword'
import Passwordless from 'supertokens-auth-react/recipe/passwordless'
const routerInfo: {
  router?: ReturnType<typeof useRouter>;
  pathName?: string
} = {} 

export function setRouter(router: ReturnType<typeof useRouter>, pathName: string) {
  routerInfo.router = router
  routerInfo.pathName = pathName
}

export const frontendConfig = (): SuperTokensConfig => {
  return {
    appInfo,
    recipeList: [
      ThirdParty.init({
        signInAndUpFeature: {
          providers: [
            Google.init(),
            Github.init(),
          ]
        }
      }),
      EmailPassword.init(),
      Passwordless.init({contactMethod: "PHONE"}),
      SessionReact.init(),
    ],
    windowHandler: (original) => ({
      ...original,
      location: {
        ...original.location,
        getPathName: () => routerInfo.pathName!,
        assign: (url) => routerInfo.router!.push(url.toString()),
        setHref: (url) => routerInfo.router!.push(url.toString()),
      },
    }),
  }
}