'use client'
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function SetPasswordPage() {
  const [password, setPassword] = useState("")
  const router = useRouter()

  const handleSave = async () => {
    const res = await fetch("http://localhost:3000/super-tokens/phone-signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        phone: localStorage.getItem('phone'),
        password,
      })
    })
  
    console.log('status code:', res.status)
    const data = await res.json()
    console.log('phone-signup response:', data)
    if (data.status === 'OK') {
      router.push('/')
    } else {
      console.error('Failed:', data)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md border p-6 rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-4">Set your password</h2>

        <input
          type="password"
          className="w-full border p-2 rounded mb-3"
          placeholder="New password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleSave}
          className="w-full bg-blue-500 text-white py-2 rounded"
        >
          Save Password
        </button>
      </div>
    </div>
  )
}