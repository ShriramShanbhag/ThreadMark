export type AIToolId =
  | 'chatgpt'
  | 'gemini'
  | 'grok'
  | 'claude'
  | 'perplexity';

export interface Bookmark {
  id: string;
  tool: AIToolId;
  url: string;
  title: string;
  description: string;
  createdAt: number;
  updatedAt: number;
  brokenSince?: number;
}

export type NewBookmark = Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'>;
