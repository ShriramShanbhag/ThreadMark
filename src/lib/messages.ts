import type { Bookmark, NewBookmark } from './types';

export type RuntimeMessage =
  | { type: 'SAVE_BOOKMARK'; bookmark: NewBookmark }
  | { type: 'GET_PAGE_INFO' }
  | { type: 'BOOKMARK_DEAD'; url: string }
  | { type: 'OPEN_BOOKMARK'; bookmarkId: string; url: string };

export interface PageInfo {
  toolId: import('./types').AIToolId | null;
  url: string;
  title: string;
  description: string;
  isLiveChat: boolean;
}

export type SaveBookmarkResponse =
  | { ok: true; bookmark: Bookmark }
  | { ok: false; error: string };

export type GenericResponse = { ok: true } | { ok: false; error: string };
