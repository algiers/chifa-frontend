import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => request.cookies.get(name)?.value,
        set: (name, value, options) => {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove: (name, options) => {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  let session = null;
  try {
    const {
      data: { session: sessionData },
      error: sessionError
    } = await supabase.auth.getSession();
    
    session = sessionData;
    
    if (sessionError) {
      console.log('[Middleware] Session error:', sessionError);
    }
  } catch (error) {
    console.log('[Middleware] Session fetch failed:', error);
  }

  const { pathname } = request.nextUrl;

  // Log détaillé pour debugging
  console.log('[Middleware] Path:', pathname, 'Session:', !!session);
  if (session) {
    console.log('[Middleware] User ID:', session.user?.id);
    console.log('[Middleware] Session expires at:', new Date(session.expires_at! * 1000));
  }
  
  // Log les cookies disponibles
  const cookies = request.cookies.getAll();
  console.log('[Middleware] Available cookies:', cookies.map(c => c.name).join(', '));
  const supabaseCookies = cookies.filter(c => c.name.includes('supabase') || c.name.includes('sb-'));
  console.log('[Middleware] Supabase cookies:', supabaseCookies.map(c => `${c.name}=${c.value.substring(0, 20)}...`));

  // Routes protégées qui nécessitent une authentification
  const protectedRoutes = ['/dashboard', '/history', '/settings', '/complete-pharmacy-profile'];
  // Routes d'authentification (où l'utilisateur ne devrait pas aller s'il est déjà loggué)
  const authRoutes = ['/login', '/register', '/forgot-password'];

  if (!session && protectedRoutes.some(route => pathname.startsWith(route))) {
    // Rediriger vers login si non authentifié et tente d'accéder à une route protégée
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirectTo', pathname); // Garder la page de destination
    return NextResponse.redirect(redirectUrl);
  }

  if (session && authRoutes.some(route => pathname.startsWith(route))) {
    // Rediriger vers dashboard si authentifié et tente d'accéder à une page d'auth
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // Gérer le rafraîchissement de la session pour les Server Components
  // Cela est important pour que les Server Components aient toujours la session la plus à jour.
  // await supabase.auth.getUser(); // Décommenter si vous utilisez getUser dans les SC et que la session n'est pas à jour.

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - assets (dossier public/assets)
     * - images (dossier public/images)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|assets|images).*)',
  ],
};
