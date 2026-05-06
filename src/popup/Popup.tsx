import { useEffect, useState } from 'react';
import { siteForUrl } from '../lib/sites';
import type { PageInfo, RuntimeMessage } from '../lib/messages';
import type { Bookmark } from '../lib/types';
import { listBookmarks } from '../lib/db';
import { SaveForm } from './SaveForm';
import { RecentsList } from './RecentsList';

type View =
  | { kind: 'loading' }
  | { kind: 'save'; pageInfo: PageInfo }
  | { kind: 'recents'; bookmarks: Bookmark[] };

export function Popup() {
  const [view, setView] = useState<View>({ kind: 'loading' });

  useEffect(() => {
    void load();

    function reload() {
      void load();
    }

    chrome.runtime.onMessage.addListener(reload);
    return () => chrome.runtime.onMessage.removeListener(reload);
  }, []);

  async function load() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];
    const tabUrl = tab?.url ?? '';
    const site = siteForUrl(tabUrl);

    if (site && tab?.id != null) {
      const pageInfo = await getPageInfo(tab.id);
      if (pageInfo && pageInfo.isLiveChat) {
        setView({ kind: 'save', pageInfo });
        return;
      }
    }

    const bookmarks = await listBookmarks();
    setView({ kind: 'recents', bookmarks });
  }

  switch (view.kind) {
    case 'loading':
      return <div className="popup-loading">Loading…</div>;
    case 'save':
      return (
        <SaveForm
          initial={view.pageInfo}
          onSaved={() => load()}
          onShowRecents={async () => {
            const bookmarks = await listBookmarks();
            setView({ kind: 'recents', bookmarks });
          }}
        />
      );
    case 'recents':
      return (
        <RecentsList
          bookmarks={view.bookmarks}
          onChange={() => load()}
        />
      );
  }
}

async function getPageInfo(tabId: number): Promise<PageInfo | null> {
  const message: RuntimeMessage = { type: 'GET_PAGE_INFO' };
  try {
    const resp = (await chrome.tabs.sendMessage(tabId, message)) as PageInfo | undefined;
    return resp ?? null;
  } catch {
    return null;
  }
}
