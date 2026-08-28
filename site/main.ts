import '../lib/fonts.css';
import './style.css';

const banner = document.querySelector<HTMLElement>('.offline-banner');

function syncConnection() {
  if (!banner) return;
  banner.hidden = navigator.onLine;
}

window.addEventListener('online', syncConnection);
window.addEventListener('offline', syncConnection);
syncConnection();

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => undefined));
}
