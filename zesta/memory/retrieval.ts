import { retrieveSemantic, type SemanticHit } from './semantic';

export interface MemoryContext {
  snippets: string[];
  hits: SemanticHit[];
}

export async function retrieveForPrompt(input: {
  userId: string;
  query: string;
  limit?: number;
}): Promise<MemoryContext> {
  const hits = await retrieveSemantic({
    userId: input.userId,
    query: input.query,
    limit: input.limit ?? 5,
  });
  return {
    snippets: hits.map((h) => `- ${h.content}`),
    hits,
  };
}
