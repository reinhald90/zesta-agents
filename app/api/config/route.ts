import { NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { findModel } from '@/lib/ai/models';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const provider = env.ZESTA_DEFAULT_PROVIDER;

  const modelId =
    provider === 'openai'    ? env.OPENAI_MODEL :
    provider === 'anthropic' ? env.ANTHROPIC_MODEL :
    provider === 'gemini'    ? env.GEMINI_MODEL :
    'mock';

  const hasKey =
    (provider === 'openai'    && !!env.OPENAI_API_KEY) ||
    (provider === 'anthropic' && !!env.ANTHROPIC_API_KEY) ||
    (provider === 'gemini'    && !!env.GEMINI_API_KEY);

  const effective = hasKey ? provider : 'mock';
  const label =
    effective === 'mock'
      ? 'Mock (dev)'
      : findModel(modelId)?.label ?? modelId;

  return NextResponse.json({
    provider: effective,
    model: modelId,
    label,
  });
}
