'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { login } from '@/lib/data'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    console.log('🔵 Form submitted - handleLogin called', { email, password: password ? '***' : 'empty' })
    setLoading(true)
    setError('')

    try {
      console.log('🚀 Login attempt - calling login function:', { email })
      // Always use backend API
      console.log('📞 About to call login() from @/lib/data')
      const result = await login(email, password)
      console.log('✅ Login result received:', { hasToken: !!result.accessToken, hasUser: !!result.user })
      
      if (result.accessToken && result.user && result.user.id) {
        // Store recruiter info for dashboard
        if (typeof window !== 'undefined') {
          localStorage.setItem('current_user', JSON.stringify({
            email: result.user.email,
            recruiter_id: String(result.user.id),
          }))
        }
        console.log('📝 User stored, redirecting to dashboard')
        router.push('/dashboard')
        router.refresh()
      } else {
        console.error('❌ Invalid response format - missing required fields:', result)
        setError('Invalid response from server. Please try again.')
      }
    } catch (err: any) {
      console.error('❌ Login error:', err)
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
            HRMS Jobsmato
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
            />
          </div>
          <div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
              onClick={(e) => {
                console.log('🟢 Button clicked!', { loading, email: email ? 'filled' : 'empty' })
                // Don't prevent default - let form handle it
              }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
