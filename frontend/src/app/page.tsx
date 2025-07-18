import { createClient } from '@/app/utils/supabase/server'
import { redirect } from 'next/navigation'
import AuthButton from './components/AuthButton'
import Link from 'next/link'

export default async function SignInPage() {
  const supabase = await createClient()

  const { data } = await supabase.auth.getUser()
  if (data?.user) {
    redirect('/home')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 sm:p-24 bg-gradient-to-br from-blue-100 to-purple-100">
      <h1 className="text-5xl font-bold mb-8 text-blue-900">Welcome to AI Storyteller!</h1>
      <p className="text-xl mb-12 text-center text-blue-800">Sign in to continue your journey.</p>
      <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2">
        <form
          className="flex-1 flex flex-col w-full justify-center gap-2 text-foreground"
          action="/auth/sign-in"
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
          <AuthButton text="Sign In" />
          <p className="text-center text-sm mt-4">
            Don't have an account?{' '}
            <Link href="/sign-up" className="text-blue-500 hover:underline">
              Sign Up
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
