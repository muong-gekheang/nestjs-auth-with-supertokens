"use client"
import { useEffect, useState } from 'react'
import { redirectToAuth } from 'supertokens-auth-react'
import SuperTokens from 'supertokens-auth-react/ui'
import { ThirdPartyPreBuiltUI } from 'supertokens-auth-react/recipe/thirdparty/prebuiltui'
import { EmailPasswordPreBuiltUI } from 'supertokens-auth-react/recipe/emailpassword/prebuiltui'
import { PasswordlessPreBuiltUI } from 'supertokens-auth-react/recipe/passwordless/prebuiltui'
import { useRouter } from 'next/navigation'

export default function Auth() {
  const [loaded, setLoaded] = useState(false)
  const router = useRouter();

  useEffect(() => {
    if (SuperTokens.canHandleRoute([ThirdPartyPreBuiltUI, EmailPasswordPreBuiltUI, PasswordlessPreBuiltUI]) === false) {
      redirectToAuth({ redirectBack: false })
    } else {
      setLoaded(true)
    }
  }, [])

  if (loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        
        <div className="w-full max-w-md flex flex-col items-center">
          {/* SuperTokens UI */}
          <div className="w-full">
            {SuperTokens.getRoutingComponent([
              ThirdPartyPreBuiltUI,
              EmailPasswordPreBuiltUI,
              PasswordlessPreBuiltUI
            ])}
          </div>
  
          {/* Buttons */}
          <div className="mt-4 w-full flex flex-col gap-2">
            <button
              onClick={() => router.push('/auth/phone')}
              className ="w-full border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-100 transition"
            >
              Login with Phone Number
            </button>

            <button
              onClick={() => router.push('/auth/phone/log-in')}
              className="w-full border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-100 transition"
            >
              Login with Phone + Password
            </button>

  
            <button
              onClick={() => {
                localStorage.setItem('phoneSignupFlow', 'true') // ← add this
                router.push('/auth/phone/signup')
              }}
              className="w-full bg-gray-300 text-white px-4 py-2 rounded-lg hover:bg-gry-100 transition"
            >
              Sign Up with Phone Number - passwordless
            </button>

            <button
              onClick={() => {
                router.push('/auth/phone/sign-up')
              }}
              className="w-full bg-gray-300 text-white px-4 py-2 rounded-lg hover:bg-gry-100 transition"
            >
              Sign Up with Phone Number
            </button>
          </div>
  
        </div>
      </div>
    )
  }

  return null
}