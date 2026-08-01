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

    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName, lastName, email, password }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Something went wrong')
      setLoading(false)
      return
    }

    const result = await signIn('credentials', { email, password, redirect: false })
    setLoading(false)
    router.push(result?.error ? '/login' : '/dashboard')
  }

  function handleGoogleSignup() {
    trackEvent('signup_started', { method: 'google', location: 'signup_page' })
    signIn('google', { callbackUrl: '/dashboard' })
  }

  return (
    <AuthShell
      eyebrow="Get your benchmark"
      title="Create Account"
      description="Start with a five-minute assessment and turn the result into a clear learning path."
      footer={<>Already have an account?{' '}<Link href="/login" className="font-semibold text-foreground underline-offset-4 hover:underline">Sign in</Link></>}
    >
      <Button type="button" variant="outline" size="lg" onClick={handleGoogleSignup} className="w-full">
        <GoogleIcon />
        Continue with Google
      </Button>

      <div className="my-6 flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">or use email</span>
        <Separator className="flex-1" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="signup-first-name">First name</Label>
            <Input id="signup-first-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required autoComplete="given-name" placeholder="John" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-last-name">Last name</Label>
            <Input id="signup-last-name" value={lastName} onChange={(e) => setLastName(e.target.value)} required autoComplete="family-name" placeholder="Doe" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="signup-email">Email</Label>
          <Input id="signup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="you@example.com" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="signup-password">Password</Label>
            <span className="text-xs text-muted-foreground">Minimum 8 characters</span>
          </div>
          <Input id="signup-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" placeholder="Min. 8 characters" />
        </div>

        {error && <p role="alert" className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>}

        <Button type="submit" disabled={loading} size="lg" className="w-full">
          {loading ? 'Creating account...' : 'Create Account'}
        </Button>
      </form>
    </AuthShell>
  )
}
