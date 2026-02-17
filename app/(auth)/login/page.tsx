'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { localDB } from '@/lib/local-db'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    // Initialize local data
    if (typeof window !== 'undefined') {
      import('@/lib/local-storage').then(({ initializeLocalData }) => {
        initializeLocalData()
      })
    }
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Local mode - simple password check (any password works)
      const result = await localDB.signIn(email, password)
      
      if (result.user && result.recruiter) {
        router.push('/dashboard')
        router.refresh()
      } else {
        setError('Invalid credentials')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Recruiter Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to access your dashboard
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="john@recruiter.com"
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="Any password works in local mode"
            />
            <p className="text-xs text-gray-500">
              Local Mode: Use <strong>john@recruiter.com</strong>, <strong>jane@recruiter.com</strong>, or <strong>mike@recruiter.com</strong>
              <br />
              Password: Any password works
            </p>
          </div>
          <div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
