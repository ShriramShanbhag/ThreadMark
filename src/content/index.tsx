import { createRoot } from 'react-dom/client';
import { pickAdapter } from './adapters';
import type { SiteAdapter } from './adapters/types';
import { Widget } from './widget';
import type { RuntimeMessage, PageInfo } from '../lib/messages';

const HOST_ID = 'threadmark-widget-host';
const DEAD_REPORT_DELAY_MS = 4000;

function mountWidget(adapter: SiteAdapter): void {
  if (document.getElementById(HOST_ID)) return;
  const host = document.createElement('div');
  host.id = HOST_ID;
  host.style.all = 'initial';
  const anchor = adapter.mountAnchor();
  anchor.appendChild(host);
  const shadow = host.attachShadow({ mode: 'open' });
  const mountPoint = document.createElement('div');
  shadow.appendChild(mountPoint);
  createRoot(mountPoint).render(<Widget adapter={adapter} />);
}

function unmountWidget(): void {
  document.getElementById(HOST_ID)?.remove();
}

function setupMessageListener(adapter: SiteAdapter): void {
  chrome.runtime.onMessage.addListener((message: RuntimeMessage, _sender, sendResponse) => {
    if (message.type === 'GET_PAGE_INFO') {
      const info: PageInfo = {
        toolId: adapter.id,
        url: adapter.getCanonicalUrl(),
        title: adapter.getDefaultTitle(),
        description: adapter.getDefaultDescription(),
        isLiveChat: adapter.isLiveChat(),
      };
      sendResponse(info);
      return true;
    }
    return false;
  });
}

function maybeReportDead(adapter: SiteAdapter): void {
  setTimeout(() => {
    if (adapter.isLiveChat()) return;
    const message: RuntimeMessage = {
      type: 'BOOKMARK_DEAD',
      url: location.href,
    };
    void chrome.runtime.sendMessage(message);
  }, DEAD_REPORT_DELAY_MS);
}

function onUrlChange(adapter: SiteAdapter): void {
  let lastHref = location.href;
  const observer = new MutationObserver(() => {
    if (location.href !== lastHref) {
      lastHref = location.href;
      const stillLive = adapter.isLiveChat();
      if (!stillLive) {
        unmountWidget();
      } else if (!document.getElementById(HOST_ID)) {
        mountWidget(adapter);
      }
    }
  });
  observer.observe(document.documentElement, { subtree: true, childList: true });
}

function init(): void {
  const adapter = pickAdapter(location);
  if (!adapter) return;

  setupMessageListener(adapter);

  if (adapter.isLiveChat()) {
    mountWidget(adapter);
  } else {
    waitForLiveChat(adapter);
  }

  onUrlChange(adapter);
  maybeReportDead(adapter);
}

function waitForLiveChat(adapter: SiteAdapter): void {
  const start = Date.now();
  const TIMEOUT_MS = 10000;
  const observer = new MutationObserver(() => {
    if (adapter.isLiveChat()) {
      observer.disconnect();
      mountWidget(adapter);
    } else if (Date.now() - start > TIMEOUT_MS) {
      observer.disconnect();
    }
  });
  observer.observe(document.documentElement, { subtree: true, childList: true });
}

init();
