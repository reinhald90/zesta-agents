'use client';

import { signOut } from 'next-auth/react';
import { LogOut, User } from 'lucide-react';

export function UserMenu({ email }: { email?: string | null }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-line bg-white/[0.02] px-2.5 py-2">
      <div className="flex min-w-0 items-center gap-2">
        <div className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-white/[0.06]">
          <User className="h-3.5 w-3.5 text-ink-muted" />
        </div>
        <span className="truncate text-xs text-ink-muted">{email ?? 'Signed in'}</span>
      </div>
      <button
        onClick={() => signOut({ callbackUrl: '/login' })}
        className="shrink-0 rounded-md p-1 text-ink-faint transition hover:bg-white/5 hover:text-ink"
        title="Sign out"
      >
        <LogOut className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
