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
    // Check if we are on the app page
    const isApp = /\/(app|gem)(\/|\?|$)/i.test(location.pathname) || /\/u\/\d+\/(app|gem)/.test(location.pathname);
    if (!isApp) return false;

    // Check for confirmed indicators of an active chat thread
    const hasChatElements = document.querySelector(
      'user-query, model-response'
    ) !== null;

    return hasChatElements;
  },

  mountAnchor() {
    return document.body;
  },
};
