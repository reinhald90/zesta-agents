import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { ChatShell } from '@/components/chat/ChatShell';

export const metadata: Metadata = { title: 'Chat' };

export default async function ChatPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return <ChatShell userEmail={session.user.email ?? null} />;
}
