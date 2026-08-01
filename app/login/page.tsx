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

export default function LoginPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (session) router.push('/dashboard')
  }, [session, router])

  if (status === 'loading' || session) return null

  async function handleCredentialsLogin(e: React.FormEvent) {
    e.preventDefault()
    trackEvent('signup_started', { method: 'credentials', location: 'login_page' })
    setLoading(true)
    setError('')

    const result = await signIn('credentials', { email, password, redirect: false })
    setLoading(false)

    if (result?.error) setError('Invalid email or password')
    else router.push('/dashboard')
  }

  async function handleGoogleLogin() {
    trackEvent('signup_started', { method: 'google', location: 'login_page' })
    await signIn('google', { callbackUrl: '/dashboard' })
  }

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign In"
      description="Continue to your assessments, results, and community benchmarks."
      footer={<>Don&apos;t have an account?{' '}<Link href="/signup" className="font-semibold text-foreground underline-offset-4 hover:underline">Create one</Link></>}
    >
      <Button type="button" variant="outline" size="lg" onClick={handleGoogleLogin} className="w-full">
        <GoogleIcon />
        Continue with Google
      </Button>

      <div className="my-6 flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">or use email</span>
        <Separator className="flex-1" />
      </div>

      <form onSubmit={handleCredentialsLogin} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="login-email">Email</Label>
          <Input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="you@example.com" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="login-password">Password</Label>
          <Input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" placeholder="••••••••" />
        </div>

        {error && <p role="alert" className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>}

        <Button type="submit" disabled={loading} size="lg" className="w-full">
          {loading ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>
    </AuthShell>
  )
}
