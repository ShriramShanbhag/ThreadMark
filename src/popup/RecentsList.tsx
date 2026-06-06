import type { Bookmark } from '../lib/types';
import { siteById } from '../lib/sites';
import { clearBroken, deleteBookmark } from '../lib/db';
import type { RuntimeMessage } from '../lib/messages';

interface Props {
  bookmarks: Bookmark[];
  onChange: () => void;
}

const RECENT_LIMIT = 8;

export function RecentsList({ bookmarks, onChange }: Props) {
  const broken = bookmarks.filter((b) => b.brokenSince != null);
  const others = bookmarks.filter((b) => b.brokenSince == null);
  const recents = others.slice(0, RECENT_LIMIT);

  function openLibrary() {
    const url = chrome.runtime.getURL('src/library/index.html');
    void chrome.tabs.create({ url });
  }

  return (
    <div className="popup recents">
      <div className="popup-header">
        <span className="popup-title">ThreadMark</span>
        <button className="popup-link" onClick={openLibrary}>
          Open library →
        </button>
      </div>


      {broken.length > 0 && (
        <div className="popup-section">
          <div className="popup-section-title popup-warning">
            Broken bookmarks ({broken.length})
          </div>
          {broken.map((b) => (
            <BrokenRow key={b.id} bookmark={b} onChange={onChange} />
          ))}
        </div>
      )}

      <div className="popup-section">
        {recents.length === 0 ? (
          <div className="popup-empty">
            No bookmarks yet. Visit ChatGPT, Gemini, Grok, Claude, or Perplexity and click the floating Save button.
          </div>
        ) : (
          recents.map((b) => <Row key={b.id} bookmark={b} onChange={onChange} />)
        )}
      </div>

      {others.length > RECENT_LIMIT && (
        <button className="popup-btn-secondary popup-view-all" onClick={openLibrary}>
          View all {others.length} bookmarks
        </button>
      )}
    </div>
  );
}

function Row({ bookmark, onChange }: { bookmark: Bookmark; onChange: () => void }) {
  const tool = siteById(bookmark.tool);

  function open() {
    const message: RuntimeMessage = {
      type: 'OPEN_BOOKMARK',
      bookmarkId: bookmark.id,
      url: bookmark.url,
    };
    void chrome.runtime.sendMessage(message);
  }

  async function remove(e: React.MouseEvent) {
    e.stopPropagation();
    await deleteBookmark(bookmark.id);
    onChange();
  }

  return (
    <div className="bookmark-row" onClick={open} role="button" tabIndex={0}>
      <span className="bookmark-tool" style={{ background: tool?.color }}>
        {tool?.name.slice(0, 1) ?? '?'}
      </span>
      <div className="bookmark-text">
        <div className="bookmark-title">{bookmark.title}</div>
        {bookmark.description && (
          <div className="bookmark-desc">{bookmark.description}</div>
        )}
      </div>
      <button className="bookmark-delete" onClick={remove} title="Delete" aria-label="Delete">×</button>
    </div>
  );
}

function BrokenRow({ bookmark, onChange }: { bookmark: Bookmark; onChange: () => void }) {
  async function remove() {
    await deleteBookmark(bookmark.id);
    onChange();
  }
  async function keep() {
    await clearBroken(bookmark.id);
    onChange();
  }
  return (
    <div className="bookmark-row broken">
      <div className="bookmark-text">
        <div className="bookmark-title">{bookmark.title}</div>
        <div className="bookmark-desc">This chat appears gone. Delete this bookmark?</div>
      </div>
      <button className="popup-btn-secondary popup-btn-mini" onClick={keep}>Keep</button>
      <button className="popup-btn-primary popup-btn-mini" onClick={remove}>Delete</button>
    </div>
  );
}
