import type { Metadata, Viewport } from 'next';
import './globals.css';
import { zestaConfig } from '@/config/zesta.config';

export const metadata: Metadata = {
  title: { default: `${zestaConfig.name} — AI Agent`, template: `%s · ${zestaConfig.name}` },
  description: zestaConfig.tagline,
  applicationName: zestaConfig.name,
};

export const viewport: Viewport = {
  themeColor: '#07070b',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="dark">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
