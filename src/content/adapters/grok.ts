import {
  firstNonEmpty,
  pickStableUrl,
  safeQueryText,
  truncate,
  type SiteAdapter,
} from './types';

export const grokAdapter: SiteAdapter = {
  id: 'grok',
matches(loc) {
  if (/^grok\.com$/i.test(loc.hostname)) {
    return /\/(c|project|imagine)\//.test(loc.pathname);
  }
  return false;
},

getCanonicalUrl() {
  return pickStableUrl();
},

getDefaultTitle() {
  const sidebar = safeQueryText('a[aria-current="page"]');
  const docTitle = document.title.replace(/\s*[—-]\s*Grok.*$/i, '').trim();
  return firstNonEmpty(sidebar, docTitle, 'Grok chat');
},

getDefaultDescription() {
  const firstUser =
    safeQueryText('[data-testid="user-message"]') ||
    safeQueryText('main article:first-of-type') ||
    safeQueryText('main p');
  return truncate(firstUser);
},

isLiveChat() {
  const onConversationPath = /\/(c|project|imagine)\//.test(location.pathname);
  if (!onConversationPath) return false;
  return document.querySelector('main') !== null;
},

  mountAnchor() {
    return document.body;
  },
};
