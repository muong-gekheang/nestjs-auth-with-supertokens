'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PhoneSignupPage() {
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'details' | 'otp'>('details')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSendOtp = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('http://localhost:3000/phone-auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      const data = await res.json()
      if (data.status === 'OK') {
        setStep('otp')
      } else {
        setError(data.message || 'Failed to send OTP')
      }
    } catch (e) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('http://localhost:3000/phone-auth/verify-otp-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password, otp }),
      })
      const data = await res.json()
      if (data.status === 'OK') {
        router.push('/auth')
      } else {
        setError(data.message || 'Invalid OTP')
      }
    } catch (e) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-md border">
        <h2 className="text-2xl font-semibold text-center mb-6">
          Sign Up with Phone Number
        </h2>

        {step === 'details' && (
          <>
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
            <button
              onClick={handleSendOtp}
              disabled={loading}
              className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition"
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </>
        )}

        {step === 'otp' && (
          <>
            <p className="text-center text-gray-500 mb-4">
              Enter the OTP sent to {phone}
            </p>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={e => setOtp(e.target.value)}
              className="w-full mb-3 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              onClick={handleVerify}
              disabled={loading}
              className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition"
            >
              {loading ? 'Verifying...' : 'Verify & Create Account'}
            </button>
            <button
              onClick={() => setStep('details')}
              className="w-full mt-2 border border-gray-300 py-2 rounded-lg hover:bg-gray-100 transition"
            >
              Back
            </button>
          </>
        )}

        {error && (
          <p className="text-red-500 text-sm mt-3 text-center">{error}</p>
        )}

        <p className="text-center text-sm mt-4">
          Already have an account?{' '}
          <span
            className="text-blue-500 cursor-pointer hover:underline"
            onClick={() => router.push('/auth')}
          >
            Login
          </span>
        </p>
      </div>
    </div>
  )
}