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
  console.log('frontendConfig called')
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
      EmailPassword.init({
        signInAndUpFeature: {
          signInForm: {
            formFields: [
              {
                id: 'email',
                label: 'Email or Phone Number',
                placeholder: 'Email or phone (e.g. +855965757009)',
                validate: async (value: string) => {
                  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
                  const isPhone = /^\+?\d+$/.test(value)
                  if (!isEmail && !isPhone) {
                    return 'Please enter a valid email or phone number'
                  }
                  return undefined
                }
              } as any 
            ]
          }
        },
        override: {
          functions: (originalImplementation) => ({
            ...originalImplementation,
            signIn: async (input) => {
              const emailField = input.formFields.find((f: any) => f.id === 'email')
              if (emailField) {
                if (emailField.value.startsWith('+') || /^\d+$/.test(emailField.value)) {
                  emailField.value = `${emailField.value.replace('+', '')}@phone.com`
                }
              }
              return originalImplementation.signIn(input)
            }
          })
        }
      }),
      Passwordless.init({
        contactMethod: "PHONE",
        getRedirectionURL: async (context: any) => {
          console.log('getRedirectionURL fired', context.action) // ← add this
          if (context.action === "SUCCESS") {
            const isSignupFlow = localStorage.getItem('phoneSignupFlow');
            console.log('isSignupFlow', isSignupFlow)
            if (isSignupFlow) {
              if (context.user?.phoneNumbers?.[0]) {
                localStorage.setItem('phone', context.user.phoneNumbers[0])
              }
              localStorage.removeItem('phoneSignupFlow')
            }
            return '/auth/phone/set-password'
          }
          return undefined
        },
      }),
      SessionReact.init(),
    ],
    windowHandler: (original) => ({
      ...original,
      location: {
        ...original.location,
        getPathName: () => routerInfo.pathName!,
        assign: (url) => {
          console.log('windowHandler assign:', url.toString())
          routerInfo.router!.push(url.toString())
        },
        setHref: (url) => {
          const urlStr = url.toString()
          const currentPath = routerInfo.pathName || ''
          const isSignupFlow = localStorage.getItem('phoneSignupFlow')
        
          console.log('setHref called', { urlStr, currentPath, isSignupFlow })
        
          if (isSignupFlow && urlStr === '/' && currentPath === '/auth') {
            localStorage.removeItem('phoneSignupFlow')
            routerInfo.router!.push('/auth/phone/set-password')
            return
          }
        
          routerInfo.router!.push(urlStr || '/')
        },
      },
    }),
  }
}