'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PhoneAuthPage() {
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [step, setStep] = useState<'login' | 'otp' | 'setPassword'>('login')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async () => {
    console.log('handleLogin called', { phone, password })
    console.log('about to fetch')
    try {
      console.log('inside try') 
      const res = await fetch('http://localhost:3000/super-tokens/phone-signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ phone, password }),
      })
      console.log('status code:', res.status)
      const data = await res.json()
      console.log('signin response:', data)
  
      if (data.status === 'OK') {
        router.push('/')
      } else {
        setError('Invalid phone number or password')
      }
    } catch (e) {
      console.error('fetch error:', e)
    }
    
  }

  const handleSignup = () => {
    localStorage.setItem('phoneSignupFlow', 'true')
    router.push('/auth')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-md border">
        <h2 className="text-2xl font-semibold text-center mb-6">
          Login with Phone Number
        </h2>

        <input
          type="text"
          placeholder="Phone number (e.g. +855965757009)"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          className="w-full mb-3 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full mb-3 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        {error && (
          <p className="text-red-500 text-sm mb-3 text-center">
            {error}
          </p>
        )}

        <button
          onClick={handleLogin}
          className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition duration-200"
        >
          Login
        </button>

        <p className="text-center text-sm mt-4">
          Don't have an account?{' '}
          <span
            className="text-blue-500 cursor-pointer hover:underline"
            onClick={() => router.push('/auth/phone/signup')}
          >
            Sign up
          </span>
        </p>
      </div>
    </div>
  )
}