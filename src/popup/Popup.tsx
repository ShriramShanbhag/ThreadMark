import { useEffect, useState } from 'react';
import type { PageInfo } from '../lib/messages';
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
    return () => chrome.runtime.removeListener(reload);
  }, []);

  async function load() {
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
