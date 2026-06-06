import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Bookmark, NewBookmark } from './types';

interface ThreadMarkDB extends DBSchema {
  bookmarks: {
    key: string;
    value: Bookmark;
    indexes: {
      byCreatedAt: number;
      byTool: string;
    };
  };
}

const DB_NAME = 'threadmark';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<ThreadMarkDB>> | null = null;

function getDB(): Promise<IDBPDatabase<ThreadMarkDB>> {
  if (!dbPromise) {
    dbPromise = openDB<ThreadMarkDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('bookmarks')) {
          const store = db.createObjectStore('bookmarks', { keyPath: 'id' });
          store.createIndex('byCreatedAt', 'createdAt');
          store.createIndex('byTool', 'tool');
        }
      },
    });
  }
  return dbPromise;
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `bm_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function exportAllBookmarks(): Promise<Bookmark[]> {
  return await listBookmarks();
}

export async function bulkImportBookmarks(bookmarks: NewBookmark[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('bookmarks', 'readwrite');
  const now = Date.now();
  for (const input of bookmarks) {
    const bookmark: Bookmark = {
      ...input,
      id: newId(),
      createdAt: now,
      updatedAt: now,
    };
    await tx.store.put(bookmark);
  }
  await tx.done;
}

export async function addBookmark(input: NewBookmark): Promise<Bookmark> {
  const now = Date.now();
  const bookmark: Bookmark = {
    ...input,
    id: newId(),
    createdAt: now,
    updatedAt: now,
  };
  const db = await getDB();
  await db.put('bookmarks', bookmark);
  return bookmark;
}

export async function listBookmarks(): Promise<Bookmark[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('bookmarks', 'byCreatedAt');
  return all.reverse();
}

export async function getBookmark(id: string): Promise<Bookmark | undefined> {
  const db = await getDB();
  return db.get('bookmarks', id);
}

export async function updateBookmark(
  id: string,
  patch: Partial<Omit<Bookmark, 'id' | 'createdAt'>>,
): Promise<Bookmark | undefined> {
  const db = await getDB();
  const existing = await db.get('bookmarks', id);
  if (!existing) return undefined;
  const updated: Bookmark = { ...existing, ...patch, updatedAt: Date.now() };
  await db.put('bookmarks', updated);
  return updated;
}

export async function deleteBookmark(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('bookmarks', id);
}

export async function findByUrl(url: string): Promise<Bookmark | undefined> {
  const all = await listBookmarks();
  return all.find((b) => b.url === url);
}

export async function markBroken(id: string): Promise<void> {
  await updateBookmark(id, { brokenSince: Date.now() });
}

export async function clearBroken(id: string): Promise<void> {
  await updateBookmark(id, { brokenSince: undefined });
}
