import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { AuthForm } from '@/components/auth/AuthForm';

export const metadata = { title: 'Masuk' };

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect('/chat');

  return (
    <div className="glass rounded-2xl p-6 shadow-[0_20px_80px_-30px_rgba(124,109,242,0.6)]">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-accent to-cyan text-sm font-bold text-white">
          Z
        </div>
        <h1 className="text-lg font-semibold tracking-tight">Masuk ke Zesta</h1>
        <p className="mt-1 text-xs text-ink-muted">Belum punya akun?{' '}
          <Link href="/register" className="text-accent-soft hover:underline">Daftar</Link>
        </p>
      </div>
      <AuthForm mode="login" />
    </div>
  );
}
