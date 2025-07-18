import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
    newUser: '/register',
  },
  providers: [
    // Providers are added in auth.ts since they require server-side dependencies
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnChat = nextUrl.pathname.startsWith('/chat');
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
      const isOnAuth = nextUrl.pathname.startsWith('/login') || nextUrl.pathname.startsWith('/register');

      // Redirect authenticated users away from auth pages
      if (isLoggedIn && isOnAuth) {
        return Response.redirect(new URL('/dashboard', nextUrl));
      }

      // Protect chat and dashboard routes
      if ((isOnChat || isOnDashboard) && !isLoggedIn) {
        return false; // Redirect to login page
      }

      return true;
    },
  },
} satisfies NextAuthConfig;