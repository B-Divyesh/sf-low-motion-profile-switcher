import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isPreservedElement, PAUSED_MEDIA_ATTR, pauseAutoplayMedia, policyCss, restorePausedMedia, shouldApply } from '../../lib/motion-policy';

describe('motion policy', () => {
  beforeEach(() => { document.body.innerHTML = ''; });

  it('keeps explicit status and progress regions exempt in every profile', () => {
    for (const profile of ['gentle', 'balanced', 'still'] as const) {
      const css = policyCss(profile);
      expect(css).toContain('[role="status"]');
      expect(css).toContain('[role="progressbar"]');
      expect(css).toContain('[aria-live]');
    }
  });

  it('does not apply while a temporary exception is active', () => {
    expect(shouldApply({ enabled: true, profile: 'balanced', allowUntil: 2000 }, 1000)).toBe(false);
    expect(shouldApply({ enabled: true, profile: 'balanced', allowUntil: 900 }, 1000)).toBe(true);
    expect(shouldApply({ enabled: false, profile: 'still' }, 1000)).toBe(false);
  });

  it('recognizes descendants of preserved regions', () => {
    document.body.innerHTML = '<div role="status"><span id="signal"></span></div><span id="noise"></span>';
    expect(isPreservedElement(document.querySelector('#signal')!)).toBe(true);
    expect(isPreservedElement(document.querySelector('#noise')!)).toBe(false);
  });

  it('pauses autoplay media outside status regions and restores only what it paused', async () => {
    document.body.innerHTML = '<video id="ambient" autoplay></video><div role="status"><video id="signal" autoplay></video></div>';
    const ambient = document.querySelector<HTMLVideoElement>('#ambient')!;
    const signal = document.querySelector<HTMLVideoElement>('#signal')!;
    Object.defineProperty(ambient, 'paused', { value: false, configurable: true });
    Object.defineProperty(signal, 'paused', { value: false, configurable: true });
    const pause = vi.spyOn(ambient, 'pause').mockImplementation(() => undefined);
    const play = vi.spyOn(ambient, 'play').mockResolvedValue();
    const signalPause = vi.spyOn(signal, 'pause').mockImplementation(() => undefined);
    pauseAutoplayMedia();
    expect(pause).toHaveBeenCalledOnce();
    expect(signalPause).not.toHaveBeenCalled();
    expect(ambient.getAttribute(PAUSED_MEDIA_ATTR)).toBe('true');
    restorePausedMedia();
    expect(play).toHaveBeenCalledOnce();
    expect(ambient.hasAttribute(PAUSED_MEDIA_ATTR)).toBe(false);
  });

  it('can enforce the policy on a media element when playback begins after the initial scan', () => {
    document.body.innerHTML = '<audio id="delayed" autoplay></audio>';
    const delayed = document.querySelector<HTMLAudioElement>('#delayed')!;
    Object.defineProperty(delayed, 'paused', { value: true, configurable: true });
    const pause = vi.spyOn(delayed, 'pause').mockImplementation(() => undefined);

    pauseAutoplayMedia();
    expect(pause).not.toHaveBeenCalled();
    expect(delayed.hasAttribute(PAUSED_MEDIA_ATTR)).toBe(false);

    Object.defineProperty(delayed, 'paused', { value: false, configurable: true });
    pauseAutoplayMedia(delayed);
    expect(pause).toHaveBeenCalledOnce();
    expect(delayed.getAttribute(PAUSED_MEDIA_ATTR)).toBe('true');
  });
});
