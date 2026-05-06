import { useState } from 'react';
import type { PageInfo } from '../lib/messages';
import { addBookmark } from '../lib/db';
import { siteById } from '../lib/sites';

interface Props {
  initial: PageInfo;
  onSaved: () => void;
  onShowRecents: () => void;
}

export function SaveForm({ initial, onSaved, onShowRecents }: Props) {
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const tool = initial.toolId ? siteById(initial.toolId) : null;

  async function handleSave() {
    if (!initial.toolId) {
      setError('Unsupported site');
      setStatus('error');
      return;
    }
    if (!title.trim()) {
      setError('Title is required');
      setStatus('error');
      return;
    }
    setStatus('saving');
    setError(null);
    try {
      await addBookmark({
        tool: initial.toolId,
        url: initial.url,
        title: title.trim(),
        description: description.trim(),
      });
      setStatus('saved');
      setTimeout(onSaved, 700);
    } catch (e) {
      setStatus('error');
      setError(e instanceof Error ? e.message : 'Failed to save');
    }
  }

  return (
    <div className="popup save-form">
      <div className="popup-header">
        <span className="popup-title">Bookmark this chat</span>
        {tool && (
          <span className="popup-tool-tag" style={{ background: tool.color }}>
            {tool.name}
          </span>
        )}
      </div>

      <label className="popup-field">
        <span>Title</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          autoFocus
          disabled={status === 'saving'}
        />
      </label>

      <label className="popup-field">
        <span>Description</span>
        <textarea
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={1000}
          disabled={status === 'saving'}
        />
      </label>

      {error && <div className="popup-error">{error}</div>}

      <div className="popup-actions">
        <button className="popup-btn-secondary" onClick={onShowRecents} disabled={status === 'saving'}>
          View saved
        </button>
        <button
          className="popup-btn-primary"
          onClick={handleSave}
          disabled={status === 'saving' || status === 'saved'}
        >
          {status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved ✓' : 'Save'}
        </button>
      </div>
    </div>
  );
}
