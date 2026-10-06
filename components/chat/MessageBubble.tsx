'use client';
import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export interface ChatMsg { id: string; role: 'user' | 'assistant'; content: string }

export const MessageBubble = memo(function MessageBubble({ msg }: { msg: ChatMsg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={cn('flex w-full animate-fade-in', isUser ? 'justify-end' : 'justify-start')}>
      <div className={cn('max-w-[min(760px,92%)] rounded-2xl px-4 py-3 text-[15px] leading-relaxed',
        isUser
          ? 'bg-gradient-to-br from-accent/90 to-accent-glow/90 text-white shadow-[0_8px_30px_-12px_rgba(124,109,242,0.7)]'
          : 'glass text-ink',
      )}>
        {isUser ? (
          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
        ) : (
          <div className="zesta-prose">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className ?? '');
                  if (inline || !match) {
                    return <code className={className} {...props}>{children}</code>;
                  }
                  return <CodeBlock language={match[1]} code={String(children).replace(/\n$/, '')} />;
                },
              }}
            >
              {msg.content || '…'}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
});

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    });
  };
  return (
    <div className="group relative my-3 overflow-hidden rounded-xl border border-line bg-black/40">
      <div className="flex items-center justify-between border-b border-line px-3 py-1.5 text-[11px] uppercase tracking-wider text-ink-faint">
        <span>{language}</span>
        <button onClick={copy} className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-ink-muted transition hover:bg-white/5 hover:text-ink">
          {copied ? <><Check className="h-3 w-3" />Copied</> : <><Copy className="h-3 w-3" />Copy</>}
        </button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{ margin: 0, background: 'transparent', fontSize: '13px', padding: '14px 16px' }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
