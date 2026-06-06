# ThreadMark.ai

  > Bookmark and collate interesting chat sessions across ChatGPT, Gemini, Grok, Claude, and Perplexity — all from one Chrome extension. Your data never leaves your browser.

  [![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](LICENSE)
  [![Manifest](https://img.shields.io/badge/Manifest-V3-green.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)

  ## What it does

  Ever had a brilliant chat with an AI tool, lost the tab, and never found it again? `ThreadMark.ai` adds a small "Save" button to supported AI sites and a popup library so
  you can keep, search, and revisit your best conversations across tools.

  - One library, five tools — no more "was that on Claude or Perplexity?"
  - Editable, prefilled title and description on save
  - Local-first storage in your browser's IndexedDB — no accounts, no servers, no telemetry
  - Detects when a saved chat is no longer reachable and offers to clean it up

  ## Supported AI tools

  | Tool       | Domains                              |
  | ---------- | ------------------------------------ |
  | ChatGPT    | `chatgpt.com`, `chat.openai.com`     |
  | Gemini     | `gemini.google.com`                  |
  | Grok       | `grok.com`, `x.com/i/grok`           |
  | Claude     | `claude.ai`                          |
  | Perplexity | `www.perplexity.ai`                  |

  > The DOM scrapers are heuristic. If a tool ships a redesign and the prefilled title looks wrong, please [open an issue](../../issues/new) — adapter fixes are usually a 5-line
   PR.

  ## Screenshots

  _TODO: add screenshots of the in-page floating button, the popup save form, and the library page._

  ## Install

  ### From source (recommended for now)

  ```bash
  git clone https://github.com/<github-user>/collate-ai-chats.git
  cd collate-ai-chats
  npm install
  npm run build
  ```

  Then in Chrome:

  1. Open `chrome://extensions`
  2. Toggle **Developer mode** on (top-right)
  3. Click **Load unpacked**
  4. Select the generated `dist/` folder

  ### From the Chrome Web Store

  _Not published yet — coming soon._

  ## Usage

  - Open a chat on any supported AI tool. A small **Save to ThreadMark** pill appears bottom-right. Click it.
  - Or click the extension's toolbar icon while on a chat — same form, prefilled.
  - Click the toolbar icon anywhere else to see your recent bookmarks; click **Open library →** for the full view.
  - The library lets you search, filter by tool, edit, and delete bookmarks.
  - If you click a bookmark whose chat has been deleted on the source site, the extension flags it with a "Keep / Delete" prompt the next time you open the popup or library.

  ## Privacy

  Everything stays on your machine. Specifically:

  - Bookmarks are stored in **IndexedDB**, scoped to the extension itself.
  - No analytics, no remote requests beyond the AI sites you already visit.
  - The content scripts only run on the supported AI domains (see `manifest.config.ts`).

  ## Tech stack

  - **React 18** + **TypeScript** for all UI surfaces
  - **Vite 5** + [`@crxjs/vite-plugin`](https://crxjs.dev/vite-plugin) for the MV3 build
  - **`idb`** as a tiny Promise wrapper around IndexedDB
  - **Chrome Manifest V3** — service worker background, content scripts, popup, full-page library

  ## Project structure

  ```
  ThreadMark/
  ├── manifest.config.ts          # MV3 manifest (sites, permissions, action)
  ├── vite.config.ts
  ├── public/icons/               # Toolbar icons
  └── src/
      ├── background/
      │   └── service-worker.ts   # Message router; tracks opened-bookmark tab ids
      ├── content/
      │   ├── index.tsx           # Picks an adapter by hostname, mounts the widget
      │   ├── widget.tsx          # Shadow-DOM React widget: floating button + save modal
      │   └── adapters/           # Per-tool DOM heuristics
      ├── popup/                  # Toolbar popup (save form + recents)
      ├── library/                # Full-page bookmark library
      ├── lib/                    # db, types, messages, sites
      └── styles/
  ```

  ## Development

  ```bash
  npm install
  npm run dev      # Vite dev server with HMR for popup/library
  npm run build    # type-check + production build into dist/
  ```

  Reload the unpacked extension in `chrome://extensions` after each build.

  ## Roadmap

  Tracked in [GitHub Issues](../../issues). Highlights:

  - **Tags** — free-form labels per bookmark, with autocomplete
  - **Filter & sort** — multi-tool selection, date sorting, broken-only view, persisted preferences
  - **Collections** — named, ordered, many-to-many groupings
  - **Import / export** — versioned JSON backup and restore

  ## Contributing

  PRs welcome — especially adapter fixes when an AI site redesigns. See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, the adapter contract, and the contribution workflow.

  ## License
  
  [GNU Affero General Public License v3.0](LICENSE) © 2026 ShriramShanbhag
  
  This means you can use, modify, and redistribute the code freely — but if you run a modified version as a network service (e.g., a hosted bookmark-sync backend), you must
  publish your modified source under the same license.
