import { defineBackground } from 'wxt/utils/define-background';

export default defineBackground(() => {
  // The service worker intentionally has no remote work. It provides the
  // extension lifecycle boundary while all preferences remain browser-local.
});
