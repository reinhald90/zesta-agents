import type { Metadata } from 'next';
import { ChatShell } from '@/components/chat/ChatShell';

export const metadata: Metadata = { title: 'Chat' };

export default function ChatPage() {
  return <ChatShell />;
}
