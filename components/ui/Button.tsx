import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'ghost' | 'outline';

export function Button({
  className, variant = 'primary', ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      {...props}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'primary' &&
          'bg-gradient-to-br from-accent to-accent-glow px-3.5 py-2 text-white shadow-[0_8px_30px_-10px_rgba(124,109,242,0.8)] hover:brightness-110',
        variant === 'outline' &&
          'border border-line bg-white/[0.02] px-3.5 py-2 text-ink hover:bg-white/[0.05]',
        variant === 'ghost' && 'px-2.5 py-1.5 text-ink-muted hover:bg-white/[0.05] hover:text-ink',
        className,
      )}
    />
  );
}
