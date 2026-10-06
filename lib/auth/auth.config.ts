import type { NextAuthConfig } from 'next-auth';

/**
 * Config edge-safe (tanpa bcrypt, tanpa DB).
 * Dipakai oleh middleware + sebagai base config di auth.ts.
 */
export const authConfig: NextAuthConfig = {
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [], // diisi di lib/auth/index.ts
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;

      const isProtected = pathname.startsWith('/chat')
        || pathname.startsWith('/dashboard')
        || pathname.startsWith('/settings')
        || pathname.startsWith('/memory');

      if (isProtected && !isLoggedIn) return false; // NextAuth redirect ke /login
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = (user as { id?: string }).id;
        token.email = user.email ?? undefined;
        token.name = user.name ?? undefined;
      }
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      return session;
    },
  },
};
