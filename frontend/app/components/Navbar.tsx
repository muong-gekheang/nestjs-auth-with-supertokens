'use client'
import { useSessionContext } from 'supertokens-auth-react/recipe/session'
import Session from 'supertokens-auth-react/recipe/session'
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const session = useSessionContext()
  const router = useRouter()

  const handleSignout = async () => {
    await Session.signOut() // 👈 tells backend to invalidate session + clears all cookies
    router.push('/auth')
  }

  if (session.loading) return null // don't render anything while checking session

  return (
    <nav className="w-full flex items-center justify-between px-8 py-4 bg-white shadow-sm">
      {/* Logo / App name */}
      <span
        onClick={() => router.push('/')}
        className="text-xl font-bold text-gray-800 cursor-pointer"
      >
        MyApp
      </span>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {session.doesSessionExist ? (
          <>
            <span className="text-sm text-gray-500">
              {session.userId}
            </span>
            <button
              onClick={handleSignout}
              className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition"
            >
              Logout
            </button>
          </>
        ) : (
          <button
            onClick={() => router.push('/auth')}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
          >
            Login
          </button>
        )}
      </div>
    </nav>
  )
}