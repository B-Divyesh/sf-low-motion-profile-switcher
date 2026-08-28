import type { MotionProfile, SiteSetting } from './settings';
import { isTemporarilyAllowed } from './settings';

export const STYLE_ID = 'low-motion-profile-switcher-policy';
export const PAUSED_MEDIA_ATTR = 'data-low-motion-paused';

const preservedSelectors = '[role="status"], [role="status"] *, [role="progressbar"], [role="progressbar"] *, [aria-live], [aria-live] *, progress, progress *, meter, meter *';
const motionTargets = `*:not(${preservedSelectors}), *:not(${preservedSelectors})::before, *:not(${preservedSelectors})::after`;

export function policyCss(profile: MotionProfile): string {
  const rules: Record<MotionProfile, string> = {
    gentle: `
      :root { scroll-behavior: auto !important; }
      ${motionTargets} {
        animation-duration: 160ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 120ms !important;
        transition-delay: 0ms !important;
      }
    `,
    balanced: `
      :root { scroll-behavior: auto !important; }
      ${motionTargets} {
        animation-duration: 1ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 80ms !important;
        transition-delay: 0ms !important;
      }
    `,
    still: `
      :root { scroll-behavior: auto !important; }
      ${motionTargets} {
        animation: none !important;
        transition: none !important;
      }
    `,
  };
  return rules[profile];
}

export function shouldApply(setting: SiteSetting, now = Date.now()): boolean {
  return setting.enabled && !isTemporarilyAllowed(setting, now);
}

export function isPreservedElement(element: Element): boolean {
  return Boolean(element.closest('[role="status"], [role="progressbar"], [aria-live], progress, meter'));
}

export function pauseAutoplayMedia(root: ParentNode = document): void {
  root.querySelectorAll<HTMLMediaElement>('video[autoplay], video[loop], audio[autoplay], audio[loop]').forEach((media) => {
    if (isPreservedElement(media) || media.paused) return;
    media.pause();
    media.setAttribute(PAUSED_MEDIA_ATTR, 'true');
  });
}

export function restorePausedMedia(root: ParentNode = document): void {
  root.querySelectorAll<HTMLMediaElement>(`[${PAUSED_MEDIA_ATTR}="true"]`).forEach((media) => {
    media.removeAttribute(PAUSED_MEDIA_ATTR);
    void media.play().catch(() => undefined);
  });
}
