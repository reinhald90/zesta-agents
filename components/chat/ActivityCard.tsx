'use client';
import { Brain, CheckCircle2, Database, Globe2, Loader2, Sparkles } from 'lucide-react';
import type { ActivityKind } from '@/zesta/core/agent';

const ICONS: Record<ActivityKind, React.ElementType> = {
  planning: Brain,
  researching: Globe2,
  reading: Globe2,
  verifying: Sparkles,
  reflecting: Brain,
  memory_update: Database,
  responding: Loader2,
  completed: CheckCircle2,
};

export function ActivityCard({ kind, label, live }: { kind: ActivityKind; label: string; live?: boolean }) {
  const Icon = ICONS[kind] ?? Sparkles;
  return (
    <div className="glass inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs text-ink-muted">
      <Icon className={kind === 'completed' ? 'h-3.5 w-3.5 text-accent-soft' : 'h-3.5 w-3.5 text-accent-soft animate-pulse-soft'} />
      <span>{label}</span>
      {live && <span className="ml-1 h-1.5 w-1.5 rounded-full bg-accent animate-pulse-soft" />}
    </div>
  );
}
