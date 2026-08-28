import './main';

const storageKey = 'demo:low-motion-profile-switcher';
type Profile = 'gentle' | 'balanced' | 'still';
type DemoState = { exception: boolean; profile: Profile };

const preview = document.querySelector<HTMLElement>('.demo-preview')!;
const stateCopy = document.querySelector<HTMLElement>('#demo-state')!;
const profileButtons = [...document.querySelectorAll<HTMLButtonElement>('[role="radio"][data-profile]')];
const exceptionButton = document.querySelector<HTMLButtonElement>('[data-exception]')!;

function readState(): DemoState {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? '{}') as Partial<DemoState>;
    if (saved.profile === 'gentle' || saved.profile === 'balanced' || saved.profile === 'still') {
      return { profile: saved.profile, exception: saved.exception === true };
    }
  } catch { /* A blocked localStorage is still a safe, resettable demo. */ }
  return { profile: 'balanced', exception: false };
}

let state = readState();

function saveState() {
  try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch { /* The preview remains usable without storage. */ }
}

function render() {
  preview.dataset.profile = state.profile;
  preview.toggleAttribute('data-exception', state.exception);
  profileButtons.forEach((button) => button.setAttribute('aria-checked', String(button.dataset.profile === state.profile)));
  if (state.exception) {
    stateCopy.textContent = `Motion is allowed temporarily. ${state.profile[0].toUpperCase()}${state.profile.slice(1)} resumes when the exception ends.`;
    exceptionButton.textContent = 'End temporary exception';
  } else {
    stateCopy.textContent = `${state.profile[0].toUpperCase()}${state.profile.slice(1)} is active for this sample.`;
    exceptionButton.textContent = 'Allow motion for 10 minutes';
  }
}

profileButtons.forEach((button) => button.addEventListener('click', () => {
  state = { ...state, profile: button.dataset.profile as Profile, exception: false };
  saveState();
  render();
}));
profileButtons.forEach((button, index) => button.addEventListener('keydown', (event) => {
  const direction = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1
    : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0;
  if (!direction) return;
  event.preventDefault();
  const next = profileButtons[(index + direction + profileButtons.length) % profileButtons.length];
  next.click();
  next.focus();
}));
exceptionButton.addEventListener('click', () => {
  state = { ...state, exception: !state.exception };
  saveState();
  render();
});
document.querySelector<HTMLButtonElement>('[data-reset-demo]')!.addEventListener('click', () => {
  localStorage.removeItem(storageKey);
  state = { profile: 'balanced', exception: false };
  render();
  stateCopy.textContent = 'Demo reset. Balanced is active for this sample.';
});
render();
