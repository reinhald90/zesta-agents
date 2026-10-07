import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import { authConfig } from './auth.config';
import { findUserByEmail, verifyPassword } from '@/database/queries/users';
import { isDbEnabled } from '@/database/client';

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!isDbEnabled) {
          console.warn('[auth] DATABASE_URL kosong, authorize di-skip.');
          return null;
        }
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await findUserByEmail(parsed.data.email);
        if (!user) return null;

        const ok = await verifyPassword(user, parsed.data.password);
        if (!ok) return null;

        return { id: user.id, email: user.email, name: user.name ?? user.email };
      },
    }),
  ],
});
