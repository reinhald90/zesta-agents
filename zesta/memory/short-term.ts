import type { ChatMessage } from '@/lib/ai/providers';

/**
 * Short-term memory = konteks percakapan saat ini.
 * Phase 2: window terakhir dari messages dalam 1 conversation.
 */
export function buildShortTermWindow(
  history: ChatMessage[],
  max = 20,
): ChatMessage[] {
  return history.slice(-max);
}
