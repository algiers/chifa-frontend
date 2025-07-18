import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Public paths that don't require authentication
  const publicPaths = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/api/auth',
    '/api/health',
    '/',
  ];
  
  const isPublicPath = publicPaths.some(publicPath => 
    path === publicPath || path.startsWith(publicPath + '/')
  );

  // Static assets and system paths
  const isStaticAsset = [
    '/_next',
    '/favicon.ico',
    '/images',
    '/fonts',
    '/icons',
    '/manifest.json',
    '/robots.txt',
    '/sitemap.xml',
  ].some(staticPath => path.startsWith(staticPath));

  // Skip middleware for static assets
  if (isStaticAsset) {
    return NextResponse.next();
  }

  // API routes that require authentication
  const protectedApiRoutes = [
    '/api/chat',
    '/api/conversations',
    '/api/user',
  ];
  
  const isProtectedApiRoute = protectedApiRoutes.some(apiPath => 
    path.startsWith(apiPath)
  );

  // Skip middleware for non-protected API routes
  if (path.startsWith('/api') && !isProtectedApiRoute) {
    return NextResponse.next();
  }

  try {
    // Create Supabase client and get session
    const supabase = createSupabaseServerClient();
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Middleware auth error:', error);
    }
    
    const isAuthenticated = !!session?.user;

    // Handle protected API routes
    if (isProtectedApiRoute) {
      if (!isAuthenticated) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      // Add user info to headers for API routes
      const response = NextResponse.next();
      response.headers.set('x-user-id', session.user.id);
      response.headers.set('x-user-email', session.user.email || '');
      return response;
    }

    // Redirect authenticated users away from auth pages
    if (isAuthenticated && isPublicPath && path !== '/') {
      const redirectTo = request.nextUrl.searchParams.get('callbackUrl') || '/chat-v2';
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }

    // Redirect unauthenticated users to login (except for public paths)
    if (!isAuthenticated && !isPublicPath) {
      const redirectUrl = new URL('/login', request.url);
      
      // Preserve the original URL for redirect after login
      if (path !== '/login') {
        redirectUrl.searchParams.set('callbackUrl', request.url);
      }
      
      return NextResponse.redirect(redirectUrl);
    }

    // Handle root path redirect for authenticated users
    if (isAuthenticated && path === '/') {
      return NextResponse.redirect(new URL('/chat-v2', request.url));
    }

    return NextResponse.next();
    
  } catch (error) {
    console.error('Middleware error:', error);
    
    // On error, redirect to login for protected routes
    if (!isPublicPath) {
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('error', 'auth_error');
      return NextResponse.redirect(redirectUrl);
    }
    
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Other static assets
     */
    '/((?!_next/static|_next/image|favicon.ico|images|fonts|icons|manifest.json|robots.txt|sitemap.xml).*)',
  ],
};