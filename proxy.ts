import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function proxy(request: NextRequest) {
  const { supabase, user, response } = await updateSession(request)

  const isAuthRoute = request.nextUrl.pathname.startsWith('/auth')
  const isOnboardingRoute = request.nextUrl.pathname.startsWith('/onboarding')
  const isAppRoute = request.nextUrl.pathname.startsWith('/app')

  // Case 1: Unauthenticated user trying to access app or onboarding
  if (!user && (isAppRoute || isOnboardingRoute)) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/auth/login'
    redirectUrl.searchParams.set('returnTo', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Case 2: Authenticated user
  if (user) {
    // If they are on login/signup, redirect to dashboard or onboarding
    if (isAuthRoute) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/app/dashboard'
      return NextResponse.redirect(redirectUrl)
    }

    // Check completion level to enforce onboarding redirect
    // We run a fast query to Supabase. Since proxy runs in Node.js on server, this is fully supported.
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('completion_level')
        .eq('user_id', user.id)
        .maybeSingle()

      const completionLevel = profile?.completion_level

      // If user has not started onboarding (profile doesn't exist or level is NULL)
      if (completionLevel === null || completionLevel === undefined) {
        // Redirigir a onboarding if they are not already there
        if (isAppRoute) {
          const redirectUrl = request.nextUrl.clone()
          redirectUrl.pathname = '/onboarding/path-selector'
          return NextResponse.redirect(redirectUrl)
        }
      }
    } catch (e) {
      console.error('Error fetching user profile in proxy:', e)
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - logo.png, icon.png, fitto*.png (asset files)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
