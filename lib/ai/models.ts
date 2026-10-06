export interface ModelInfo {
  id: string;
  provider: 'openai' | 'anthropic' | 'gemini' | 'mock';
  label: string;
  contextWindow: number;
}

export const MODEL_REGISTRY: ModelInfo[] = [
  { id: 'gpt-4o-mini', provider: 'openai', label: 'GPT-4o mini', contextWindow: 128_000 },
  { id: 'gpt-4o',      provider: 'openai', label: 'GPT-4o',      contextWindow: 128_000 },
  { id: 'claude-3-5-sonnet-latest', provider: 'anthropic', label: 'Claude 3.5 Sonnet', contextWindow: 200_000 },
  { id: 'gemini-2.0-flash',         provider: 'gemini',    label: 'Gemini 2.0 Flash',  contextWindow: 1_000_000 },
];

export function findModel(id: string): ModelInfo | undefined {
  return MODEL_REGISTRY.find(m => m.id === id);
}
