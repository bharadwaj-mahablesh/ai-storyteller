import { createClient } from '@/app/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/select-profile'

  if (code) {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && user) {
      // Check if account profile exists
      const { data: account, error: accountError } = await supabase
        .from('accounts')
        .select('id')
        .eq('id', user.id)
        .single()

      if (account && !accountError) {
        return NextResponse.redirect(`${request.url.split('/').slice(0, 3).join('/')}${next}`)
      } else {
        return NextResponse.redirect(`${request.url.split('/').slice(0, 3).join('/')}/onboarding/create-account-profile`)
      }
    }
  }

  // return the user to an error page with some instructions
  return NextResponse.redirect(`${request.url.split('/').slice(0, 3).join('/')}/error`)
}


