import { browser } from 'wxt/browser';
import '../../lib/fonts.css';
import './style.css';
import { DEFAULT_SETTING, exceptionEnd, getEffectiveSetting, isTemporarilyAllowed, normalizeHostname, STORAGE_KEY, type MotionProfile, type SiteSetting, type SiteSettings } from '../../lib/settings';

const enabledInput = document.querySelector<HTMLInputElement>('#enabled')!;
const siteName = document.querySelector<HTMLElement>('#site-name')!;
const stateCopy = document.querySelector<HTMLElement>('#state-copy')!;
const controls = document.querySelector<HTMLElement>('#controls')!;
const unavailable = document.querySelector<HTMLElement>('#unavailable')!;
const exceptionButton = document.querySelector<HTMLButtonElement>('#exception')!;
const announcement = document.querySelector<HTMLElement>('#announcement')!;
const profileInputs = [...document.querySelectorAll<HTMLInputElement>('input[name="profile"]')];
let hostname: string | null = null;
let allSettings: SiteSettings = {};
let current: SiteSetting = { ...DEFAULT_SETTING };
let tick: number | undefined;

function announce(message: string) {
  announcement.textContent = '';
  window.setTimeout(() => { announcement.textContent = message; }, 20);
}

function profileName(profile: MotionProfile) {
  return profile[0].toUpperCase() + profile.slice(1);
}

function render() {
  if (!hostname) return;
  current = getEffectiveSetting(current);
  enabledInput.checked = current.enabled;
  profileInputs.forEach((input) => {
    input.checked = input.value === current.profile;
    input.disabled = !current.enabled || isTemporarilyAllowed(current);
  });
  const temporary = isTemporarilyAllowed(current);
  document.body.dataset.state = !current.enabled ? 'off' : temporary ? 'temporary' : 'on';
  exceptionButton.disabled = !current.enabled;
  exceptionButton.classList.toggle('is-active', temporary);
  if (!current.enabled) {
    stateCopy.textContent = 'Low motion is off on this site';
    exceptionButton.querySelector('b')!.textContent = 'Allow motion for 10 minutes';
    exceptionButton.querySelector('small')!.textContent = 'Enable a profile first';
  } else if (temporary && current.allowUntil) {
    const minutes = Math.max(1, Math.ceil((current.allowUntil - Date.now()) / 60_000));
    stateCopy.textContent = `Motion allowed temporarily · ${minutes} min left`;
    exceptionButton.querySelector('b')!.textContent = 'End temporary exception';
    exceptionButton.querySelector('small')!.textContent = `${profileName(current.profile)} resumes immediately`;
  } else {
    stateCopy.textContent = `${profileName(current.profile)} profile is active`;
    exceptionButton.querySelector('b')!.textContent = 'Allow motion for 10 minutes';
    exceptionButton.querySelector('small')!.textContent = 'Temporary exception for this site';
  }
}

async function save(next: SiteSetting, message: string) {
  if (!hostname) return;
  current = next;
  allSettings = { ...allSettings, [hostname]: next };
  try {
    await browser.storage.local.set({ [STORAGE_KEY]: allSettings });
    render();
    announce(message);
  } catch {
    stateCopy.textContent = 'Could not save. Try reopening the extension.';
    document.body.dataset.state = 'error';
    announce('Could not save your profile. Try reopening the extension.');
  }
}

enabledInput.addEventListener('change', () => {
  void save({ ...current, enabled: enabledInput.checked, allowUntil: undefined }, enabledInput.checked ? `${profileName(current.profile)} profile enabled` : 'Low motion disabled for this site');
});

profileInputs.forEach((input) => input.addEventListener('change', () => {
  if (input.checked) void save({ ...current, enabled: true, profile: input.value as MotionProfile, allowUntil: undefined }, `${profileName(input.value as MotionProfile)} profile applied`);
}));

exceptionButton.addEventListener('click', () => {
  const active = isTemporarilyAllowed(current);
  void save({ ...current, allowUntil: active ? undefined : exceptionEnd() }, active ? `${profileName(current.profile)} profile resumed` : 'Motion allowed for 10 minutes');
});

async function init() {
  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    hostname = normalizeHostname(tab?.url ?? '');
    if (!hostname) {
      controls.hidden = true;
      unavailable.hidden = false;
      enabledInput.disabled = true;
      return;
    }
    siteName.textContent = hostname.replace(/^www\./, '');
    const stored = await browser.storage.local.get(STORAGE_KEY);
    allSettings = (stored[STORAGE_KEY] ?? {}) as SiteSettings;
    current = getEffectiveSetting(allSettings[hostname] ?? DEFAULT_SETTING);
    render();
    tick = window.setInterval(render, 15_000);
  } catch {
    controls.hidden = true;
    unavailable.hidden = false;
    unavailable.querySelector('h2')!.textContent = 'The current tab was not available';
  }
}

window.addEventListener('unload', () => tick && window.clearInterval(tick));
void init();
