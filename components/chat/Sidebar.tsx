'use client';
import Link from 'next/link';
import { Plus, MessageSquare, Brain, Globe2, Database, Sparkles, Activity, LayoutDashboard, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ConversationMeta { id: string; title: string; updatedAt: number }

export function Sidebar({
  conversations, activeId, onNew, onSelect, onDelete,
}: {
  conversations: ConversationMeta[];
  activeId: string | null;
  onNew: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-line bg-bg-soft/60 backdrop-blur-xl">
      <div className="flex items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-accent to-cyan text-xs font-bold text-white">Z</div>
          <span className="text-sm font-semibold tracking-tight">Zesta</span>
        </Link>
      </div>

      <div className="px-3">
        <button
          onClick={onNew}
          className="flex w-full items-center gap-2 rounded-lg border border-line bg-white/[0.02] px-3 py-2 text-sm text-ink transition hover:bg-white/[0.05]"
        >
          <Plus className="h-4 w-4" /> New Chat
        </button>
      </div>

      <nav className="mt-4 flex flex-col px-3 text-sm">
        <NavItem href="/research" icon={Globe2} label="Research" />
        <NavItem href="/learn"    icon={Brain}  label="Learning" />
        <NavItem href="/memory"   icon={Database} label="Memory" />
        <NavItem href="/skills"   icon={Sparkles} label="Skills" />
        <NavItem href="/activity" icon={Activity} label="Activity" />
        <NavItem href="/dashboard" icon={LayoutDashboard} label="Dashboard" />
        <NavItem href="/settings" icon={Settings} label="Settings" />
      </nav>

      <div className="mt-6 flex-1 overflow-y-auto px-3 pb-4">
        <div className="px-2 pb-2 text-[11px] uppercase tracking-wider text-ink-faint">Conversations</div>
        <div className="flex flex-col gap-0.5">
          {conversations.length === 0 && (
            <p className="px-2 py-3 text-xs text-ink-faint">Belum ada percakapan.</p>
          )}
          {conversations.map((c) => (
            <div
              key={c.id}
              className={cn(
                'group flex items-center justify-between rounded-lg px-2 py-1.5 text-sm transition',
                activeId === c.id ? 'bg-white/[0.06] text-ink' : 'text-ink-muted hover:bg-white/[0.03] hover:text-ink',
              )}
            >
              <button
                onClick={() => onSelect(c.id)}
                className="flex w-full items-center gap-2 truncate text-left"
                title={c.title}
              >
                <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-70" />
                <span className="truncate">{c.title || 'Untitled'}</span>
              </button>
              <button
                onClick={() => onDelete(c.id)}
                className="ml-1 hidden rounded p-0.5 text-ink-faint hover:bg-white/10 hover:text-ink group-hover:block"
                title="Delete"
              >×</button>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

function NavItem({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-ink-muted transition hover:bg-white/[0.03] hover:text-ink">
      <Icon className="h-4 w-4 opacity-80" />
      <span>{label}</span>
    </Link>
  );
}
