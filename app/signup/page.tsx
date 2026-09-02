'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn, useSession } from 'next-auth/react'
import AuthShell from '@/components/auth/AuthShell'
import GoogleIcon from '@/components/auth/GoogleIcon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { trackEvent } from '@/lib/analytics'

export default function SignupPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (session) router.push('/dashboard')
  }, [session, router])

  if (status === 'loading' || session) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    trackEvent('signup_started', { method: 'credentials', location: 'signup_page' })
    setLoading(true)
    setError('')

    let accountCreated = false
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email, password }),
      })
      accountCreated = res.ok
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Something went wrong')
        return
      }
      const result = await signIn('credentials', { email, password, redirect: false })
      router.push(!result || result.error ? '/login' : '/profile/complete')
    } catch {
      // Once registration succeeds, retry login instead of creating a duplicate account.
      if (accountCreated) router.push('/login')
      else setError('Could not create your account. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleSignup() {
    trackEvent('signup_started', { method: 'google', location: 'signup_page' })
    setError('')
    try {
      await signIn('google', { callbackUrl: '/profile/complete' })
    } catch {
      setError('Could not open Google sign-in. Please try again.')
    }
  }

  return (
    <AuthShell
      title="Create Account"
      description="Sign up to start your assessment"
      footer={<>Already have an account?{' '}<Link href="/login" className="font-semibold text-foreground underline-offset-4 hover:underline">Sign in</Link></>}
    >
      <Button type="button" variant="outline" size="lg" onClick={handleGoogleSignup} className="h-12 w-full bg-white hover:bg-white/80">
        <GoogleIcon />
        Continue with Google
      </Button>

      <div className="my-6 flex items-center gap-4">
        <Separator className="flex-1" />
        <span className="text-xs font-medium uppercase text-muted-foreground">or</span>
        <Separator className="flex-1" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="signup-first-name">First Name</Label>
            <Input id="signup-first-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required autoComplete="given-name" placeholder="John" className="h-10 bg-white" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-last-name">Last Name</Label>
            <Input id="signup-last-name" value={lastName} onChange={(e) => setLastName(e.target.value)} required autoComplete="family-name" placeholder="Doe" className="h-10 bg-white" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="signup-email">Email</Label>
          <Input id="signup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="you@example.com" className="h-10 bg-white" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="signup-password">Password</Label>
          <Input id="signup-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" placeholder="Min. 8 characters" className="h-10 bg-white" />
        </div>

        {error && <p role="alert" className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>}

        <Button type="submit" disabled={loading} size="lg" className="h-12 w-full">
          {loading ? 'Creating account...' : 'Create Account'}
        </Button>
      </form>
    </AuthShell>
  )
}
