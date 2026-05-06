import { addBookmark, findByUrl, markBroken } from '../lib/db';
import type {
  RuntimeMessage,
  SaveBookmarkResponse,
  GenericResponse,
} from '../lib/messages';

type AnyResponse = SaveBookmarkResponse | GenericResponse | undefined;

chrome.runtime.onMessage.addListener(
  (message: RuntimeMessage, sender, sendResponse: (resp: AnyResponse) => void) => {
    handleMessage(message, sender)
      .then(sendResponse)
      .catch((err: unknown) => {
        const error = err instanceof Error ? err.message : String(err);
        sendResponse({ ok: false, error });
      });
    return true;
  },
);

async function handleMessage(
  message: RuntimeMessage,
  sender: chrome.runtime.MessageSender,
): Promise<AnyResponse> {
  switch (message.type) {
    case 'SAVE_BOOKMARK': {
      const bookmark = await addBookmark(message.bookmark);
      return { ok: true, bookmark };
    }
    case 'BOOKMARK_DEAD': {
      const tabId = sender.tab?.id;
      const id = tabId != null ? await consumeOpenedBookmark(tabId) : null;
      if (id) {
        await markBroken(id);
      } else {
        const existing = await findByUrl(message.url);
        if (existing) await markBroken(existing.id);
      }
      return { ok: true };
    }
    case 'OPEN_BOOKMARK': {
      const tab = await chrome.tabs.create({ url: message.url });
      if (tab.id != null) await rememberOpenedBookmark(tab.id, message.bookmarkId);
      return { ok: true };
    }
    default:
      return { ok: false, error: 'unhandled-message' };
  }
}

const SESSION_PREFIX = 'opened-bookmark:';

async function rememberOpenedBookmark(tabId: number, bookmarkId: string): Promise<void> {
  await chrome.storage.session.set({ [`${SESSION_PREFIX}${tabId}`]: bookmarkId });
}

async function consumeOpenedBookmark(tabId: number): Promise<string | null> {
  const key = `${SESSION_PREFIX}${tabId}`;
  const data = await chrome.storage.session.get(key);
  const value = data[key];
  if (typeof value !== 'string') return null;
  await chrome.storage.session.remove(key);
  return value;
}

chrome.tabs.onRemoved.addListener((tabId) => {
  void chrome.storage.session.remove(`${SESSION_PREFIX}${tabId}`);
});
