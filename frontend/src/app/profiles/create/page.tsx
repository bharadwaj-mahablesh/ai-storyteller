import { createClient } from '@/app/utils/supabase/server'
import { redirect } from 'next/navigation'
import AuthButton from '@/app/components/AuthButton'
import Link from 'next/link'

export default async function CreateNewProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/') // Redirect to sign-in if not logged in
  }

  const createProfile = async (formData: FormData) => {
    'use server'
    const supabase = await createClient()
    const name = String(formData.get('name'))
    const age_group = String(formData.get('age_group'))
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      redirect('/')
    }

    const { error } = await supabase.from('profiles').insert({
      account_id: user.id,
      name: name,
      age_group: age_group,
    })

    if (!error) {
      redirect('/select-profile') // Redirect back to select profile after creating a new one
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 sm:p-24 bg-gradient-to-br from-blue-100 to-purple-100">
      <h1 className="text-3xl font-bold mb-4 text-center">Create a New Listening Profile</h1>
      <p className="text-center text-lg mb-8">Add another profile for your family.</p>

      <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2">
        <form
          className="flex-1 flex flex-col w-full justify-center gap-2 text-foreground"
          action={createProfile}
        >
          <label className="text-md" htmlFor="name">
            Profile Name
          </label>
          <input
            className="rounded-md px-4 py-2 bg-inherit border mb-6"
            name="name"
            placeholder="Rohan or Mom's Profile"
            required
          />
          <label className="text-md" htmlFor="age_group">
            Age Group
          </label>
          <select
            className="rounded-md px-4 py-2 bg-inherit border mb-6"
            name="age_group"
            required
          >
            <option value="">Select Age Group</option>
            <option value="3-7">3-7 years</option>
            <option value="8-12">8-12 years</option>
            <option value="adult">Adult</option>
          </select>
          <AuthButton text="Create Profile" />
        </form>
      </div>

      <Link href="/select-profile" className="mt-8 text-blue-500 hover:underline">
        Back to Profile Selection
      </Link>
    </div>
  )
}
