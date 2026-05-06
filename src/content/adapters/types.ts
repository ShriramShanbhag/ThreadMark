import type { AIToolId } from '../../lib/types';

export interface SiteAdapter {
  id: AIToolId;
  matches(loc: Location): boolean;
  getCanonicalUrl(): string;
  getDefaultTitle(): string;
  getDefaultDescription(): string;
  isLiveChat(): boolean;
  mountAnchor(): HTMLElement;
}

export function truncate(text: string, max = 240): string {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= max) return cleaned;
  return cleaned.slice(0, max - 1).trimEnd() + '…';
}

export function firstNonEmpty(...values: Array<string | null | undefined>): string {
  for (const v of values) {
    if (v && v.trim()) return v.trim();
  }
  return '';
}

export function safeQueryText(selector: string): string {
  const el = document.querySelector(selector);
  return el?.textContent?.trim() ?? '';
}

export function pickStableUrl(): string {
  const url = new URL(location.href);
  const drop = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'ref'];
  for (const k of drop) url.searchParams.delete(k);
  return url.toString();
}
