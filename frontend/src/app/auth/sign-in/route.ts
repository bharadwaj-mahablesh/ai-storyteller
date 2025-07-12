import { createClient } from '@/app/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const requestUrl = new URL(request.url)
  const formData = await request.formData()
  const email = String(formData.get('email'))
  const password = String(formData.get('password'))
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return NextResponse.redirect(
      `${requestUrl.origin}/?error=Could not authenticate user`
    )
  }

  // Check if account profile exists
  const { data: account, error: accountError } = await supabase
    .from('accounts')
    .select('id')
    .eq('id', user.id)
    .single()

  if (account && !accountError) {
    // Check if any profiles exist for this account
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .eq('account_id', user.id)

    if (profiles && profiles.length > 0) {
      return NextResponse.redirect(`${requestUrl.origin}/select-profile`)
    } else {
      return NextResponse.redirect(`${requestUrl.origin}/onboarding/create-first-profile`)
    }
  } else {
    return NextResponse.redirect(`${requestUrl.origin}/onboarding/create-account-profile`)
  }
}
