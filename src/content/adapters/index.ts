import { chatgptAdapter } from './chatgpt';
import { geminiAdapter } from './gemini';
import { grokAdapter } from './grok';
import { claudeAdapter } from './claude';
import { perplexityAdapter } from './perplexity';
import type { SiteAdapter } from './types';

export const ALL_ADAPTERS: SiteAdapter[] = [
  chatgptAdapter,
  geminiAdapter,
  grokAdapter,
  claudeAdapter,
  perplexityAdapter,
];

export function pickAdapter(loc: Location = location): SiteAdapter | null {
  return ALL_ADAPTERS.find((a) => a.matches(loc)) ?? null;
}
