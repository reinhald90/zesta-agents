import Link from 'next/link';
import { ArrowRight, Brain, Globe2, Sparkles, Database, Shield, Zap } from 'lucide-react';
import { zestaConfig } from '@/config/zesta.config';

const features = [
  { icon: Brain,    title: 'Learning Engine',  desc: 'Zesta belajar dari pengalaman dan merefleksikan hasilnya.' },
  { icon: Globe2,   title: 'Web Research',     desc: 'Menelusuri sumber publik, membandingkan, dan memverifikasi.' },
  { icon: Database, title: 'Layered Memory',   desc: 'Short-term, episodic, semantic, dan skill — dipisah rapi.' },
  { icon: Shield,   title: 'Safety Layer',     desc: 'Kebijakan yang tidak dapat diubah oleh agent sendiri.' },
  { icon: Sparkles, title: 'Personality',      desc: 'Behavioral parameters: curiosity, skepticism, empathy.' },
  { icon: Zap,      title: 'Multi-provider',   desc: 'Gemini, OpenAI, Anthropic — lewat satu abstraksi.' },
];

export default function LandingPage() {
  return (
    <main className="relative overflow-hidden">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-radial-fade" />
        <div
          className="absolute inset-0 bg-grid opacity-[0.35]"
          style={{ backgroundSize: '56px 56px', maskImage: 'radial-gradient(ellipse at 50% 0%, black 40%, transparent 75%)' }}
        />
      </div>

      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-accent to-cyan glow-ring">
            <span className="text-sm font-bold text-white">Z</span>
          </div>
          <span className="font-semibold tracking-tight">{zestaConfig.name}</span>
          <span className="ml-2 rounded-full border border-line px-2 py-0.5 text-[10px] uppercase tracking-wider text-ink-muted">
            {zestaConfig.version}
          </span>
        </div>
        <nav className="hidden items-center gap-6 text-sm text-ink-muted md:flex">
          <Link href="/chat" className="hover:text-ink">Chat</Link>
          <Link href="/learn" className="hover:text-ink">Learn</Link>
          <Link href="/research" className="hover:text-ink">Research</Link>
          <Link href="/docs" className="hover:text-ink">Docs</Link>
        </nav>
        <Link
          href="/chat"
          className="rounded-full bg-white px-4 py-1.5 text-sm font-medium text-black transition hover:bg-white/90"
        >
          Talk to Zesta
        </Link>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 pb-24 pt-20 text-center md:pt-28">
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-white/[0.03] px-3 py-1 text-xs text-ink-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse-soft" />
          Autonomous learning · Memory · Multi-provider
        </div>

        <h1 className="text-balance text-5xl font-semibold tracking-tight md:text-7xl">
          Meet <span className="bg-gradient-to-br from-white via-accent-soft to-cyan bg-clip-text text-transparent">Zesta</span>.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-ink-muted md:text-xl">
          AI agent yang bisa <span className="text-ink">research</span>, <span className="text-ink">learn</span>,{' '}
          <span className="text-ink">remember</span>, dan <span className="text-ink">adapt</span>.
          Bukan sekadar chatbot.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/chat"
            className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-accent to-accent-glow px-5 py-2.5 text-sm font-medium text-white shadow-[0_10px_40px_-10px_rgba(124,109,242,0.8)] transition hover:brightness-110"
          >
            Talk to Zesta
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full border border-line bg-white/[0.02] px-5 py-2.5 text-sm text-ink transition hover:bg-white/[0.05]"
          >
            Explore Zesta
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="glass group rounded-2xl p-5 transition hover:-translate-y-0.5 hover:border-white/15">
              <div className="mb-4 grid h-9 w-9 place-items-center rounded-lg border border-line bg-white/[0.03]">
                <Icon className="h-4 w-4 text-accent-soft" />
              </div>
              <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
              <p className="mt-1.5 text-sm text-ink-muted">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-6 text-xs text-ink-faint md:flex-row">
          <span>© {new Date().getFullYear()} {zestaConfig.name}. Built with Next.js.</span>
          <span>zesta-agents.vercel.app</span>
        </div>
      </footer>
    </main>
  );
}
