import { createClient } from '@/app/utils/supabase/server'
import { redirect } from 'next/navigation'
import ProfileCard from '@/app/components/ProfileCard'
import Link from 'next/link'

export default async function SelectProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/') // Redirect to sign-in if not logged in
  }

  // Fetch existing profiles for this account
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, name, age_group')
    .eq('account_id', user.id)

  if (profilesError || !profiles || profiles.length === 0) {
    // If no profiles exist, redirect to create the first one
    redirect('/onboarding/create-first-profile')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 sm:p-24 bg-gradient-to-br from-blue-100 to-purple-100">
      <h1 className="text-3xl font-bold mb-4 text-center">Who's Listening Today?</h1>
      <p className="text-center text-lg mb-8">Select a profile to continue.</p>

      <div className="flex flex-wrap justify-center gap-4 mb-8">
        {profiles.map((profile) => (
          <ProfileCard
            key={profile.id}
            id={profile.id}
            name={profile.name}
            ageGroup={profile.age_group}
          />
        ))}
        <Link href="/profiles/create">
          <div className="bg-white p-6 rounded-lg shadow-md text-center cursor-pointer hover:shadow-lg transition-shadow duration-200 flex flex-col items-center justify-center h-full">
            <h2 className="text-xl font-semibold mb-2">Add New Profile</h2>
            <div className="text-5xl text-blue-500 hover:text-blue-700">+</div>
          </div>
        </Link>
      </div>
    </div>
  )
}
