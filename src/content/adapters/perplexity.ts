import {
  firstNonEmpty,
  pickStableUrl,
  safeQueryText,
  truncate,
  type SiteAdapter,
} from './types';

export const perplexityAdapter: SiteAdapter = {
  id: 'perplexity',

  matches(loc) {
    return /^(www\.)?perplexity\.ai$/i.test(loc.hostname);
  },

  getCanonicalUrl() {
    return pickStableUrl();
  },

  getDefaultTitle() {
    const heading = safeQueryText('main h1') || safeQueryText('h1');
    const docTitle = document.title.replace(/\s*[—-]\s*Perplexity.*$/i, '').trim();
    return firstNonEmpty(heading, docTitle, 'Perplexity thread');
  },

  getDefaultDescription() {
    const firstUser =
      safeQueryText('main h1') ||
      safeQueryText('main [data-testid="user-message"]') ||
      safeQueryText('main p');
    return truncate(firstUser);
  },

  isLiveChat() {
    const isThread =
      /\/search\//.test(location.pathname) ||
      /\/page\//.test(location.pathname) ||
      /\/collections\//.test(location.pathname);
    if (!isThread) return false;
    return document.querySelector('main') !== null;
  },

  mountAnchor() {
    return document.body;
  },
};
