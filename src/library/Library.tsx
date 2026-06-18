import { useEffect, useMemo, useRef, useState } from 'react';
import {
  bulkImportBookmarks,
  clearBroken,
  deleteBookmark,
  exportAllBookmarks,
  listBookmarks,
  updateBookmark,
} from '../lib/db';
import type { Bookmark, AIToolId, NewBookmark } from '../lib/types';
import { SITES, siteById } from '../lib/sites';
import type { RuntimeMessage } from '../lib/messages';

type ToolFilter = AIToolId | 'all';

export function Library() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [query, setQuery] = useState('');
  const [tool, setTool] = useState<ToolFilter>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void reload();
  }, []);

  async function reload() {
    setBookmarks(await listBookmarks());
  }

  async function exportBookmarks() {
    const data = await exportAllBookmarks();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookmarks-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importBookmarks(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        await bulkImportBookmarks(json as NewBookmark[]);
        await reload();
      } catch (err) {
        console.error('Failed to import bookmarks:', err);
        alert('Invalid JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bookmarks.filter((b) => {
      if (tool !== 'all' && b.tool !== tool) return false;
      if (!q) return true;
      return (
        b.title.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q) ||
        b.url.toLowerCase().includes(q)
      );
    });
  }, [bookmarks, query, tool]);

  const broken = filtered.filter((b) => b.brokenSince != null);
  const normal = filtered.filter((b) => b.brokenSince == null);

  async function handleDelete(id: string) {
    const ok = window.confirm('Delete this bookmark?');
    if (!ok) return;
    await deleteBookmark(id);
    await reload();
  }

  async function handleSave(id: string, title: string, description: string) {
    await updateBookmark(id, { title, description });
    setEditingId(null);
    await reload();
  }

  async function handleKeep(id: string) {
    await clearBroken(id);
    await reload();
  }

  return (
    <div className="library">
      <header className="library-header">
        <h1>ThreadMark</h1>
        <div className="library-controls">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, description, URL…"
            className="library-search"
          />
          <select
            value={tool}
            onChange={(e) => setTool(e.target.value as ToolFilter)}
            className="library-filter"
          >
            <option value="all">All tools</option>
            {SITES.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <div className="library-actions">
            <button className="popup-btn-secondary" onClick={exportBookmarks}>Export as JSON</button>
            <button className="popup-btn-secondary" onClick={() => importInputRef.current?.click()}>Import from JSON</button>
            <input
              type="file"
              ref={importInputRef}
              onChange={importBookmarks}
              accept=".json"
              style={{ display: 'none' }}
            />
          </div>
        </div>
        <div className="library-summary">
          {filtered.length} {filtered.length === 1 ? 'bookmark' : 'bookmarks'}
          {broken.length > 0 && <span className="library-broken-count"> · {broken.length} broken</span>}
        </div>
      </header>

      {broken.length > 0 && (
        <section className="library-section">
          <h2 className="library-section-title library-warning">Broken bookmarks</h2>
          <div className="library-list">
            {broken.map((b) => (
              <BrokenCard
                key={b.id}
                bookmark={b}
                onDelete={() => handleDelete(b.id)}
                onKeep={() => handleKeep(b.id)}
              />
            ))}
          </div>
        </section>
      )}

      <section className="library-section">
        {normal.length === 0 && broken.length === 0 ? (
          <div className="library-empty">
            No bookmarks yet. Visit one of the supported AI tools and click the floating Save button.
          </div>
        ) : (
          <div className="library-list">
            {normal.map((b) => (
              <Card
                key={b.id}
                bookmark={b}
                editing={editingId === b.id}
                onEdit={() => setEditingId(b.id)}
                onCancelEdit={() => setEditingId(null)}
                onSave={(title, description) => handleSave(b.id, title, description)}
                onDelete={() => handleDelete(b.id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

interface CardProps {
  bookmark: Bookmark;
  editing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: (title: string, description: string) => void;
  onDelete: () => void;
}

function Card({ bookmark, editing, onEdit, onCancelEdit, onSave, onDelete }: CardProps) {
  const tool = siteById(bookmark.tool);
  const [title, setTitle] = useState(bookmark.title);
  const [description, setDescription] = useState(bookmark.description);

  useEffect(() => {
    setTitle(bookmark.title);
    setDescription(bookmark.description);
  }, [bookmark.title, bookmark.description, editing]);

  function open() {
    const message: RuntimeMessage = {
      type: 'OPEN_BOOKMARK',
      bookmarkId: bookmark.id,
      url: bookmark.url,
    };
    void chrome.runtime.sendMessage(message);
  }

  if (editing) {
    return (
      <div className="library-card editing">
        <div className="library-card-tool" style={{ background: tool?.color }}>{tool?.name}</div>
        <input
          className="library-card-title-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          autoFocus
        />
        <textarea
          className="library-card-desc-input"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={1000}
        />
        <div className="library-card-actions">
          <button className="popup-btn-secondary" onClick={onCancelEdit}>Cancel</button>
          <button
            className="popup-btn-primary"
            onClick={() => onSave(title.trim(), description.trim())}
            disabled={!title.trim()}
          >
            Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="library-card">
      <div className="library-card-tool" style={{ background: tool?.color }}>{tool?.name}</div>
      <div className="library-card-date">{formatDate(bookmark.createdAt)}</div>
      <div className="library-card-content">
        <button className="library-card-title" onClick={open} title={bookmark.title}>{bookmark.title}</button>
        <div className="library-card-desc">{bookmark.description}</div>
      </div>
      <div className="library-card-actions">
        <button className="icon-btn" onClick={onEdit} title="Edit">✎</button>
        <button className="icon-btn icon-btn-delete" onClick={onDelete} title="Delete">🗑</button>
        <button className="icon-btn" onClick={open} title="Open">↗</button>
      </div>
    </div>
  );
}

function BrokenCard({
  bookmark,
  onKeep,
  onDelete,
}: {
  bookmark: Bookmark;
  onKeep: () => void;
  onDelete: () => void;
}) {
  const tool = siteById(bookmark.tool);
  return (
    <div className="library-card broken">
      <div className="library-card-tool" style={{ background: tool?.color }}>{tool?.name}</div>
      <div className="library-card-date">Broken</div>
      <div className="library-card-content">
        <div className="library-card-title">{bookmark.title}</div>
        <div className="library-card-desc">This chat appears to be gone.</div>
      </div>
      <div className="library-card-actions">
        <button className="icon-btn" onClick={onKeep} title="Keep">✓</button>
        <button className="icon-btn icon-btn-delete" onClick={onDelete} title="Delete">🗑</button>
      </div>
    </div>
  );
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
