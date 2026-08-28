import '../lib/fonts.css';
import './style.css';

const banner = document.querySelector<HTMLElement>('.offline-banner');

async function syncConnection() {
  if (!banner) return;
  if (!navigator.onLine) {
    banner.hidden = false;
    return;
  }
  try {
    const response = await fetch('/online-check.txt', { cache: 'no-store', signal: AbortSignal.timeout(2_000) });
    banner.hidden = response.ok;
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === 'TimeoutError';
    banner.hidden = timedOut && navigator.onLine;
  }
}

window.addEventListener('online', () => void syncConnection());
window.addEventListener('offline', () => void syncConnection());
void syncConnection();

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => undefined));
}
