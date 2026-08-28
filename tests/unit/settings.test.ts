import { describe, expect, it } from 'vitest';
import { exceptionEnd, getEffectiveSetting, isTemporarilyAllowed, normalizeHostname } from '../../lib/settings';

describe('site settings', () => {
  it('accepts only regular web pages and normalizes hostnames', () => {
    expect(normalizeHostname('https://WWW.Example.com/a')).toBe('www.example.com');
    expect(normalizeHostname('chrome://settings')).toBeNull();
    expect(normalizeHostname('not a url')).toBeNull();
  });

  it('expires temporary exceptions without changing the profile', () => {
    const setting = getEffectiveSetting({ enabled: true, profile: 'still', allowUntil: 999 }, 1000);
    expect(setting).toEqual({ enabled: true, profile: 'still', allowUntil: undefined });
    expect(isTemporarilyAllowed(setting, 1000)).toBe(false);
  });

  it('creates a ten minute exception', () => {
    expect(exceptionEnd(1000)).toBe(601000);
  });
});
