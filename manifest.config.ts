import { defineManifest } from '@crxjs/vite-plugin';

const HOST_MATCHES = [
  'https://chatgpt.com/*',
  'https://chat.openai.com/*',
  'https://gemini.google.com/*',
  'https://grok.com/*',
  'https://x.com/i/grok*',
  'https://claude.ai/*',
  'https://www.perplexity.ai/*',
];

export default defineManifest({
  manifest_version: 3,
  name: 'ThreadMark',
  version: '0.1.0',
  description: 'Bookmark interesting chat sessions across ChatGPT, Gemini, Grok, Claude, and Perplexity.',
  action: {
    default_popup: 'src/popup/index.html',
    default_title: 'ThreadMark',
    default_icon: {
      "16": "icons/icon16.png",
      "32": "icons/icon32.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    },
  },
  icons: {
    "16": "icons/icon16.png",
    "32": "icons/icon32.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }, 
  background: {
    service_worker: 'src/background/service-worker.ts',
    type: 'module',
  },
  content_scripts: [
    {
      matches: HOST_MATCHES,
      js: ['src/content/index.tsx'],
      run_at: 'document_idle',
    },
  ],
  permissions: ['storage', 'activeTab', 'tabs'],
  host_permissions: HOST_MATCHES,
  web_accessible_resources: [
    {
      resources: ['src/library/index.html'],
      matches: ['<all_urls>'],
    },
  ],
});
