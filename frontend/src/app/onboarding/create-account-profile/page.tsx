import { createClient } from '@/app/utils/supabase/server'
import { redirect } from 'next/navigation'
import AuthButton from '@/app/components/AuthButton'

export default async function CreateAccountProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/') // Redirect to sign-in if not logged in
  }

  // Check if account profile already exists
  const { data: account, error: accountError } = await supabase
    .from('accounts')
    .select('id, full_name')
    .eq('id', user.id)
    .single()

  if (account && !accountError) {
    redirect('/onboarding/create-profile') // If account profile exists, go to create listening profile
  }

  const createAccount = async (formData: FormData) => {
    'use server'
    const supabase = await createClient()
    const full_name = String(formData.get('full_name'))
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      redirect('/')
    }

    const { error } = await supabase.from('accounts').insert({
      id: user.id,
      full_name: full_name,
    })

    if (!error) {
      redirect('/onboarding/create-first-profile')
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 sm:p-24 bg-gradient-to-br from-blue-100 to-purple-100">
      <h1 className="text-3xl font-bold mb-4 text-center">Tell us about yourself!</h1>
      <p className="text-center text-lg mb-8">This is for your main account profile.</p>
      <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2">
        <form
          className="flex-1 flex flex-col w-full justify-center gap-2 text-foreground"
          action={createAccount}
        >
          <label className="text-md" htmlFor="full_name">
            Your Full Name
          </label>
          <input
            className="rounded-md px-4 py-2 bg-inherit border mb-6"
            name="full_name"
            placeholder="John Doe"
            required
          />
          <AuthButton text="Save Account Profile" />
        </form>
      </div>
    </div>
  )
}
