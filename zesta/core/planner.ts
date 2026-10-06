export type Intent = 'chat' | 'research' | 'learn' | 'task';

export interface Plan {
  intent: Intent;
  reason: string;
}

export function plan(message: string): Plan {
  const text = message.toLowerCase();
  if (/(pelajari|belajar|ajarkan|learn|study)/.test(text)) return { intent: 'learn', reason: 'user meminta pembelajaran' };
  if (/(riset|research|cari|telusuri|browsing|search)/.test(text)) return { intent: 'research', reason: 'user meminta riset' };
  if (/(buatkan|tolong buat|generate|tulis kode|implement)/.test(text)) return { intent: 'task', reason: 'user meminta eksekusi task' };
  return { intent: 'chat', reason: 'percakapan biasa' };
}
