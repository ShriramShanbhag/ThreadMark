import {
  firstNonEmpty,
  pickStableUrl,
  safeQueryText,
  truncate,
  type SiteAdapter,
} from './types';

export const chatgptAdapter: SiteAdapter = {
  id: 'chatgpt',

  matches(loc) {
    return /^(chatgpt\.com|chat\.openai\.com)$/i.test(loc.hostname);
  },

  getCanonicalUrl() {
    return pickStableUrl();
  },

  getDefaultTitle() {
    const sidebarActive = safeQueryText('nav a[data-active="true"]');
    const docTitle = document.title.replace(/\s*[—-]\s*ChatGPT\s*$/i, '').trim();
    return firstNonEmpty(sidebarActive, docTitle, 'ChatGPT chat');
  },

  getDefaultDescription() {
    const userMsg =
      document.querySelector('[data-message-author-role="user"]')?.textContent ??
      document.querySelector('main article:first-of-type')?.textContent ??
      '';
    return truncate(userMsg);
  },

  isLiveChat() {
    if (!/\/c\/[A-Za-z0-9-]+/.test(location.pathname)) return false;
    const hasMessages = document.querySelector('[data-message-author-role]') !== null;
    return hasMessages;
  },

  mountAnchor() {
    return document.body;
  },
};
