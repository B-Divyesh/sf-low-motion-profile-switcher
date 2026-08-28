export const STORAGE_KEY = 'lowMotionSites';
export const EXCEPTION_MINUTES = 10;

export type MotionProfile = 'gentle' | 'balanced' | 'still';

export interface SiteSetting {
  enabled: boolean;
  profile: MotionProfile;
  allowUntil?: number;
}

export type SiteSettings = Record<string, SiteSetting>;

export const DEFAULT_SETTING: SiteSetting = {
  enabled: false,
  profile: 'balanced',
};

export function normalizeHostname(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return parsed.hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function getEffectiveSetting(setting: SiteSetting | undefined, now = Date.now()): SiteSetting {
  const normalized = setting ?? DEFAULT_SETTING;
  if (normalized.allowUntil && normalized.allowUntil <= now) {
    return { ...normalized, allowUntil: undefined };
  }
  return normalized;
}

export function isTemporarilyAllowed(setting: SiteSetting, now = Date.now()): boolean {
  return Boolean(setting.enabled && setting.allowUntil && setting.allowUntil > now);
}

export function exceptionEnd(now = Date.now()): number {
  return now + EXCEPTION_MINUTES * 60_000;
}
