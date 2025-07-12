'use client'

import { createClient } from '@/app/utils/supabase/client'
import { redirect } from 'next/navigation'
import AuthButton from '../components/AuthButton'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export default function SignUp() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const message = searchParams.get('message')
  const error = searchParams.get('error')

  const { data } = supabase.auth.getUser()
  if (data?.user) {
    redirect('/select-profile')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 sm:p-24 bg-gradient-to-br from-blue-100 to-purple-100">
      <h1 className="text-3xl font-bold mb-4 text-center">Create Your Account</h1>
      <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2">
        <form
          className="flex-1 flex flex-col w-full justify-center gap-2 text-foreground"
          action="/auth/sign-up"
          method="post"
        >
          <label className="text-md" htmlFor="email">
            Email
          </label>
          <input
            className="rounded-md px-4 py-2 bg-inherit border mb-6"
            name="email"
            placeholder="you@example.com"
            required
          />
          <label className="text-md" htmlFor="password">
            Password
          </label>
          <input
            className="rounded-md px-4 py-2 bg-inherit border mb-6"
            type="password"
            name="password"
            placeholder="••••••••"
            required
          />
          <AuthButton text="Sign Up" />

          {message && (
            <p className="mt-4 p-4 bg-green-100 text-green-700 text-center rounded-md">
              {message}
            </p>
          )}
          {error && (
            <p className="mt-4 p-4 bg-red-100 text-red-700 text-center rounded-md">
              {error}
            </p>
          )}

          <p className="text-center text-sm mt-4">
            Already have an account?{' '}
            <Link href="/" className="text-blue-500 hover:underline">
              Sign In
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
