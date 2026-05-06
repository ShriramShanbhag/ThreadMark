import {
  firstNonEmpty,
  pickStableUrl,
  safeQueryText,
  truncate,
  type SiteAdapter,
} from './types';

export const geminiAdapter: SiteAdapter = {
  id: 'gemini',

  matches(loc) {
    return /^gemini\.google\.com$/i.test(loc.hostname);
  },

  getCanonicalUrl() {
    return pickStableUrl();
  },

  getDefaultTitle() {
    const activeTitle = safeQueryText('div.conversation-title.selected');
    const docTitle = document.title.replace(/\s*[—-]\s*Gemini.*$/i, '').trim();
    return firstNonEmpty(activeTitle, docTitle, 'Gemini chat');
  },

  getDefaultDescription() {
    const firstUser =
      safeQueryText('user-query .query-text') ||
      safeQueryText('div[data-test-id="user-query"]') ||
      safeQueryText('main p');
    return truncate(firstUser);
  },

  isLiveChat() {
    if (!/\/app(\/|\?|$)/i.test(location.pathname) && !/\/u\/\d+\/app/.test(location.pathname)) {
      return /\/app/i.test(location.pathname);
    }
    return document.querySelector('user-query, [data-test-id="user-query"], message-content') !== null;
  },

  mountAnchor() {
    return document.body;
  },
};
