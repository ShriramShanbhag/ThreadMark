 # Contributing to ThreadMark.ai

  Thanks for thinking about contributing! This is a small, focused project — issues and PRs of any size are welcome.

  ## Ways to help

  - **Bug reports** — especially when an AI site changes its DOM and the prefilled title or first prompt looks wrong.
  - **Adapter fixes / new adapters** — usually <50 lines of code; see [Adding or fixing an adapter](#adding-or-fixing-an-adapter).
  - **Features** — pick something from the [roadmap issues](../../issues), or open a new one to discuss before building.
  - **Documentation, screenshots, accessibility audits** — appreciated.

  ## Filing an issue

  Before opening one, please:

  - Check existing [issues](../../issues) to avoid duplicates.
  - For bug reports, include: Chrome version, the AI tool affected, and what you expected vs. saw. A short DOM snippet around where the title or first message lives is gold for
  adapter bugs.

  ## Local setup

  ```bash
  git clone https://github.com/<github-user>/threadmark.git
  cd threadmark
  npm install
  npm run build
  ```

  Load the unpacked extension from `dist/` (see [README → Install](README.md#install)).

  For iterative work:

  ```bash
  npm run dev
  ```

  > Note: HMR works for the popup and library pages; content scripts and the service worker rebuild on save but you'll need to **reload** the extension in `chrome://extensions`
  after each rebuild for them to take effect.

  ## Project layout (quick tour)

  | Surface             | Where it lives                | Talks to IndexedDB via       |
  | ------------------- | ----------------------------- | ---------------------------- |
  | Popup UI            | `src/popup/`                  | `src/lib/db.ts` directly     |
  | Library page        | `src/library/`                | `src/lib/db.ts` directly     |
  | Service worker      | `src/background/`             | `src/lib/db.ts` directly     |
  | In-page widget      | `src/content/`                | Messages → service worker    |
  | Per-site DOM logic  | `src/content/adapters/`       | (read-only against the host) |

  All cross-surface messages are typed in `src/lib/messages.ts`. Don't `chrome.runtime.sendMessage` raw objects — extend `RuntimeMessage` so TypeScript catches mismatches.

  ## Adding or fixing an adapter

  This is the most common contribution path. Each adapter implements [`SiteAdapter`](src/content/adapters/types.ts):

  ```ts
  interface SiteAdapter {
    id: AIToolId;
    matches(loc: Location): boolean;
    getCanonicalUrl(): string;
    getDefaultTitle(): string;
    getDefaultDescription(): string;
    isLiveChat(): boolean;
    mountAnchor(): HTMLElement;
  }
  ```

  **To fix an existing adapter** (e.g. ChatGPT renamed its sidebar nav):

  1. Open the chat in question and find the new selectors via DevTools.
  2. Update the relevant adapter in `src/content/adapters/<tool>.ts`. Each method has a fallback chain — keep that pattern, never throw.
  3. `npm run build`, reload the extension, verify on the live site.

  **To add a new AI tool adapter:**

  1. Create `src/content/adapters/<tool>.ts` exporting a `SiteAdapter`.
  2. Register it in `src/content/adapters/index.ts` (`ALL_ADAPTERS` array).
  3. Add the tool's identity to `AIToolId` in `src/lib/types.ts` and a `SiteMeta` entry in `src/lib/sites.ts` (name, host matchers, brand color).
  4. Add the host pattern(s) to `HOST_MATCHES` in `manifest.config.ts`.
  5. Manually verify: floating button appears, save form prefills sensibly, the saved bookmark opens back into the original chat.

  Adapters should be small, pure DOM reads, and **never throw** — return sensible empty strings or `false` when in doubt. The widget gracefully degrades.

  ## Code style

  - **TypeScript strict mode** is on; please don't loosen it.
  - React function components with hooks; no class components.
  - Keep adapter files independent of React — they're pure DOM utilities.
  - Two-space indentation; existing Prettier-ish style. No formatter is enforced yet, just match what's there.
  - No comments unless they explain a non-obvious *why*. Self-documenting names beat narrative comments.

  ## Commit and PR conventions

  - One concern per PR. Adapter fixes for two tools should usually be two PRs.
  - Use imperative-mood commit subjects: `fix(chatgpt): update sidebar selector after redesign`.
  - Reference the issue: `Fixes #42` in the PR description.
  - For schema changes (`DB_VERSION` bump in `src/lib/db.ts`), describe the migration in the PR.

  ## Testing checklist (manual, for now)

  There's no automated test suite yet. Before requesting review, please confirm:

  - [ ] `npm run build` passes (TS check + Vite build).
  - [ ] The unpacked extension loads without errors in `chrome://extensions`.
  - [ ] If you touched an adapter: floating button appears on the live site; save form prefill is reasonable; saved bookmark opens correctly.
  - [ ] If you touched the popup or library: round-trip a save → recents → library → delete works.
  - [ ] If you touched the schema: migrating from the previous `DB_VERSION` doesn't lose existing bookmarks.

  ## Privacy expectations

  This extension is local-first by design. PRs that introduce remote requests, telemetry, or external SDKs need an explicit motivation and a discussion in an issue first.

  ## License

  By contributing you agree your changes ship under the project's [GNU Affero General Public License v3.0](LICENSE). If you don't want your contribution to be AGPL-licensed, please don't submit it.
