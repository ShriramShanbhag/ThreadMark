import type { AIToolId } from './types';

export interface SiteMeta {
  id: AIToolId;
  name: string;
  hostMatchers: RegExp[];
  color: string;
}

export const SITES: SiteMeta[] = [
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    hostMatchers: [/^chatgpt\.com$/i, /^chat\.openai\.com$/i],
    color: '#10a37f',
  },
  {
    id: 'gemini',
    name: 'Gemini',
    hostMatchers: [/^gemini\.google\.com$/i],
    color: '#4285f4',
  },
  {
    id: 'grok',
    name: 'Grok',
    hostMatchers: [/^grok\.com$/i, /^x\.com$/i],
    color: '#000000',
  },
  {
    id: 'claude',
    name: 'Claude',
    hostMatchers: [/^claude\.ai$/i],
    color: '#d97757',
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    hostMatchers: [/^www\.perplexity\.ai$/i, /^perplexity\.ai$/i],
    color: '#1f6f6f',
  },
];

export function siteForUrl(input: string | URL | Location | null | undefined): SiteMeta | null {
  if (!input) return null;
  let host: string;
  try {
    if (typeof input === 'string') {
      host = new URL(input).hostname;
    } else if (input instanceof URL) {
      host = input.hostname;
    } else {
      host = input.hostname;
    }
  } catch {
    return null;
  }
  return SITES.find((s) => s.hostMatchers.some((re) => re.test(host))) ?? null;
}

export function siteById(id: AIToolId): SiteMeta | undefined {
  return SITES.find((s) => s.id === id);
}
