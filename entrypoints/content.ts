import { browser } from 'wxt/browser';
import { defineContentScript } from 'wxt/utils/define-content-script';
import { pauseAutoplayMedia, policyCss, restorePausedMedia, shouldApply, STYLE_ID } from '../lib/motion-policy';
import { DEFAULT_SETTING, getEffectiveSetting, STORAGE_KEY, type SiteSettings } from '../lib/settings';

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_start',
  main() {
    const hostname = location.hostname.toLowerCase();
    let observer: MutationObserver | undefined;
    let exceptionTimer: number | undefined;

    const stopObserver = () => {
      observer?.disconnect();
      observer = undefined;
      if (exceptionTimer) window.clearTimeout(exceptionTimer);
      exceptionTimer = undefined;
    };

    const removePolicy = () => {
      document.getElementById(STYLE_ID)?.remove();
      restorePausedMedia();
      stopObserver();
    };

    const installPolicy = (css: string) => {
      let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
      if (!style) {
        style = document.createElement('style');
        style.id = STYLE_ID;
        (document.head ?? document.documentElement).append(style);
      }
      style.textContent = css;
      pauseAutoplayMedia();
      if (!observer) {
        observer = new MutationObserver((changes) => {
          for (const change of changes) {
            for (const node of change.addedNodes) {
              if (node instanceof Element) {
                if (node.matches('video[autoplay], video[loop], audio[autoplay], audio[loop]')) pauseAutoplayMedia(node.parentNode ?? document);
                else if (node.querySelector('video[autoplay], video[loop], audio[autoplay], audio[loop]')) pauseAutoplayMedia(node);
              }
            }
          }
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });
      }
    };

    const apply = async () => {
      const stored = await browser.storage.local.get(STORAGE_KEY);
      const all = (stored[STORAGE_KEY] ?? {}) as SiteSettings;
      const setting = getEffectiveSetting(all[hostname] ?? DEFAULT_SETTING);
      if (!shouldApply(setting)) {
        removePolicy();
        if (setting.enabled && setting.allowUntil) {
          const delay = Math.min(setting.allowUntil - Date.now() + 50, 2_147_483_647);
          exceptionTimer = window.setTimeout(() => void apply(), delay);
        }
        return;
      }
      installPolicy(policyCss(setting.profile));
    };

    browser.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && STORAGE_KEY in changes) void apply();
    });
    void apply();
  },
});
