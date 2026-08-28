import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

interface StaticWebAppConfig {
  routes: Array<{ route: string; headers?: Record<string, string> }>;
  responseOverrides: Record<string, { rewrite: string }>;
  globalHeaders: Record<string, string>;
  mimeTypes: Record<string, string>;
  navigationFallback?: unknown;
}

describe('static deployment response policy', () => {
  const config = JSON.parse(readFileSync('site/public/staticwebapp.config.json', 'utf8')) as StaticWebAppConfig;

  it('ships immutable caching for hashed assets and fonts and a bounded download cache', () => {
    expect(config.routes.find(({ route }) => route === '/assets/main-*')?.headers?.['Cache-Control']).toBe('public, max-age=31536000, immutable');
    expect(config.routes.find(({ route }) => route === '/fonts/*')?.headers?.['Cache-Control']).toBe('public, max-age=31536000, immutable');
    expect(config.routes.find(({ route }) => route === '/downloads/*')?.headers?.['Cache-Control']).toBe('public, max-age=3600');
  });

  it('sets the authored security and AVIF policies without an SPA fallback', () => {
    expect(config.globalHeaders['Content-Security-Policy']).toContain("default-src 'self'");
    expect(config.globalHeaders['Permissions-Policy']).toBe('camera=(), microphone=(), geolocation=()');
    expect(config.globalHeaders['Referrer-Policy']).toBe('no-referrer');
    expect(config.mimeTypes['.avif']).toBe('image/avif');
    expect(config.navigationFallback).toBeUndefined();
    expect(config.responseOverrides['404']).toEqual({ rewrite: '/404.html' });
  });
});
