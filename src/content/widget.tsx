import { useEffect, useRef, useState } from 'react';
import type { SiteAdapter } from './adapters/types';
import type {
  RuntimeMessage,
  SaveBookmarkResponse,
  GetBookmarkResponse,
  GenericResponse,
} from '../lib/messages';
import type { Bookmark } from '../lib/types';

interface Props {
  adapter: SiteAdapter;
}

type Status = 'idle' | 'saving' | 'saved' | 'error';

export function Widget({ adapter }: Props) {
  const [open, setOpen] = useState(false);
  const [existingBookmark, setExistingBookmark] = useState<Bookmark | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function check() {
      const message: RuntimeMessage = {
        type: 'GET_BOOKMARK_BY_URL',
        url: adapter.getCanonicalUrl(),
      };
      const resp = (await chrome.runtime.sendMessage(message)) as GetBookmarkResponse;
      if (resp.ok) {
        setExistingBookmark(resp.bookmark || null);
      }
    }
    void check();
  }, [adapter]);

  function openModal() {
    setTitle(existingBookmark?.title || adapter.getDefaultTitle());
    setDescription(existingBookmark?.description || adapter.getDefaultDescription());
    setStatus('idle');
    setError(null);
    setOpen(true);
  }

  useEffect(() => {
    if (open && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && open) setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  async function save() {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    setStatus('saving');
    setError(null);
    const message: RuntimeMessage = {
      type: 'SAVE_BOOKMARK',
      bookmark: {
        tool: adapter.id,
        url: adapter.getCanonicalUrl(),
        title: title.trim(),
        description: description.trim(),
      },
    };
    try {
      const resp = (await chrome.runtime.sendMessage(message)) as SaveBookmarkResponse;
      if (resp.ok) {
        setExistingBookmark(resp.bookmark);
        setStatus('saved');
        setTimeout(() => setOpen(false), 900);
      } else {
        setStatus('error');
        setError(resp.error || 'Failed to save');
      }
    } catch (e) {
      setStatus('error');
      setError(e instanceof Error ? e.message : 'Failed to save');
    }
  }

  async function unsave() {
    if (!existingBookmark) return;
    setStatus('saving');
    setError(null);
    const message: RuntimeMessage = {
      type: 'DELETE_BOOKMARK',
      bookmarkId: existingBookmark.id,
    };
    try {
      const resp = (await chrome.runtime.sendMessage(message)) as GenericResponse;
      if (resp.ok) {
        setExistingBookmark(null);
        setStatus('saved');
        setTimeout(() => setOpen(false), 900);
      } else {
        setStatus('error');
        setError(resp.error || 'Failed to unsave');
      }
    } catch (e) {
      setStatus('error');
      setError(e instanceof Error ? e.message : 'Failed to unsave');
    }
  }

  return (
    <>
      <style>{styles}</style>
      <button className="cai-fab" title={existingBookmark ? 'Unsave this chat' : 'Bookmark this chat'} onClick={existingBookmark ? unsave : openModal}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {existingBookmark ? (
            <path d="M5 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-7-3.5L5 21V5z" fill="currentColor" />
          ) : (
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          )}
        </svg>
        <span>{existingBookmark ? 'Unsave' : 'Save'}</span>
      </button>

      {open && (
        <div className="cai-overlay" onClick={() => setOpen(false)}>
          <div className="cai-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cai-modal-header">
              <h3>Bookmark this chat</h3>
              <button className="cai-close" onClick={() => setOpen(false)} aria-label="Close">×</button>
            </div>

            <label className="cai-field">
              <span>Title</span>
              <input
                ref={titleInputRef}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                disabled={status === 'saving'}
              />
            </label>

            <label className="cai-field">
              <span>Description</span>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={1000}
                disabled={status === 'saving'}
              />
            </label>

            {error && <div className="cai-error">{error}</div>}

            <div className="cai-actions">
              <button className="cai-btn-secondary" onClick={() => setOpen(false)} disabled={status === 'saving'}>
                Cancel
              </button>
              <button className="cai-btn-primary" onClick={save} disabled={status === 'saving' || status === 'saved'}>
                {status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved ✓' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const styles = `
.cai-fab {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 2147483646;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: none;
  border-radius: 999px;
  background: #1f2937;
  color: #f9fafb;
  font: 500 13px/1 system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
  cursor: pointer;
  opacity: 0.92;
  transition: opacity 120ms, transform 120ms;
}
.cai-fab:hover { opacity: 1; transform: translateY(-1px); }

.cai-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 2147483647;
  display: flex;
  align-items: center;
  justify-content: center;
  font: 14px/1.4 system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
}
.cai-modal {
  width: min(440px, calc(100vw - 32px));
  background: #fff;
  color: #111;
  border-radius: 12px;
  padding: 18px 18px 16px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25);
}
.cai-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.cai-modal h3 { margin: 0; font-size: 16px; font-weight: 600; }
.cai-close {
  background: transparent; border: none; font-size: 22px; cursor: pointer; color: #6b7280; line-height: 1;
}
.cai-field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; }
.cai-field span { font-size: 12px; font-weight: 500; color: #374151; }
.cai-field input, .cai-field textarea {
  font: inherit; padding: 8px 10px; border: 1px solid #d1d5db; border-radius: 8px;
  resize: vertical; background: #fff; color: #111;
}
.cai-field input:focus, .cai-field textarea:focus { outline: 2px solid #2563eb; outline-offset: 0; border-color: #2563eb; }
.cai-error { color: #b91c1c; font-size: 13px; margin-bottom: 8px; }
.cai-actions { display: flex; gap: 8px; justify-content: flex-end; }
.cai-btn-primary, .cai-btn-secondary {
  padding: 8px 14px; border-radius: 8px; font: inherit; font-weight: 500; cursor: pointer; border: none;
}
.cai-btn-primary { background: #2563eb; color: #fff; }
.cai-btn-primary:disabled { background: #93c5fd; cursor: default; }
.cai-btn-secondary { background: #f3f4f6; color: #111; border: 1px solid #d1d5db; }
.cai-btn-secondary:disabled { opacity: 0.6; cursor: default; }
`;
