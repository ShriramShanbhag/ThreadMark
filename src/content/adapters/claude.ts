import {
  firstNonEmpty,
  pickStableUrl,
  safeQueryText,
  truncate,
  type SiteAdapter,
} from './types';

export const claudeAdapter: SiteAdapter = {
  id: 'claude',

  matches(loc) {
    return /^claude\.ai$/i.test(loc.hostname);
  },

  getCanonicalUrl() {
    return pickStableUrl();
  },

  getDefaultTitle() {
    const header = safeQueryText('header [data-testid="chat-menu-trigger"]') ||
      safeQueryText('header h1') ||
      safeQueryText('main h1');
    const docTitle = document.title.replace(/\s*[—-]\s*Claude.*$/i, '').trim();
    return firstNonEmpty(header, docTitle, 'Claude chat');
  },

  getDefaultDescription() {
    const firstUser =
      safeQueryText('div[data-testid="user-message"]') ||
      safeQueryText('main div[data-test-render-count] p') ||
      safeQueryText('main p');
    return truncate(firstUser);
  },

  isLiveChat() {
    if (!/\/chat\/[a-f0-9-]+/i.test(location.pathname)) return false;
    return document.querySelector('#main-content') !== null;
  },

  mountAnchor() {
    return document.body;
  },
};
