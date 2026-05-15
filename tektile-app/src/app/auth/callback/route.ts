import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  console.log('AUTH CALLBACK HIT:', { code: !!code, origin, next })

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      console.log('AUTH CALLBACK SUCCESS:', data.user?.email)
      return NextResponse.redirect(`${origin}${next}`)
    }
    
    console.error('AUTH CALLBACK ERROR:', error)
    if (error.message?.includes('fetch failed')) {
      console.error('DETECTED FETCH FAILURE: This is likely an SSL or Clock issue. Check system time.')
    }
  }

  console.log('AUTH CALLBACK FALLBACK: redirecting to /dashboard')
  return NextResponse.redirect(`${origin}/dashboard`)
}
