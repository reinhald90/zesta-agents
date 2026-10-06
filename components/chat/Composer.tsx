'use client';
import { useRef, useState, type KeyboardEvent } from 'react';
import { ArrowUp, Square, Paperclip, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function Composer({
  onSend, onStop, busy, modelLabel,
}: {
  onSend: (text: string) => void;
  onStop: () => void;
  busy: boolean;
  modelLabel: string;
}) {
  const [value, setValue] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);

  const submit = () => {
    const text = value.trim();
    if (!text || busy) return;
    onSend(text);
    setValue('');
    requestAnimationFrame(() => ref.current?.focus());
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="border-t border-line bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto max-w-3xl px-4 py-4">
        <div className="glass rounded-2xl p-2 shadow-[0_10px_50px_-20px_rgba(124,109,242,0.6)]">
          <textarea
            ref={ref}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder="Kirim pesan ke Zesta…"
            className="max-h-48 w-full resize-none bg-transparent px-3 py-2 text-[15px] text-ink placeholder:text-ink-faint focus:outline-none"
            style={{ minHeight: 44 }}
          />
          <div className="flex items-center justify-between px-1 pb-1">
            <div className="flex items-center gap-1">
              <Button variant="ghost" title="Attachments (Phase 2)"><Paperclip className="h-4 w-4" /></Button>
              <Button variant="ghost" title="Tools (Phase 3)"><Wrench className="h-4 w-4" /></Button>
              <span className="ml-2 hidden rounded-md border border-line px-2 py-0.5 text-[11px] text-ink-faint sm:inline-block">
                {modelLabel}
              </span>
            </div>
            {busy ? (
              <Button variant="outline" onClick={onStop} className="!px-3 !py-1.5">
                <Square className="h-3.5 w-3.5" /> Stop
              </Button>
            ) : (
              <Button onClick={submit} disabled={!value.trim()} className="!rounded-xl !px-3 !py-1.5">
                <ArrowUp className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <p className="mt-2 text-center text-[11px] text-ink-faint">
          Zesta bisa salah. Verifikasi informasi penting.
        </p>
      </div>
    </div>
  );
}
