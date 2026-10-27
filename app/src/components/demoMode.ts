/* The prototype's own controls (screen switcher, demo clock) are hidden so every surface
   reads as the finished product. Add ?demo to any URL to bring them back for this browser
   tab; ?demo=off hides them again. */
const KEY = 'vital-demo-controls';

export function demoControlsOn(): boolean {
  try {
    const q = new URLSearchParams(window.location.search).get('demo');
    if (q !== null) {
      if (q === 'off' || q === '0') sessionStorage.removeItem(KEY);
      else sessionStorage.setItem(KEY, '1');
    }
    return sessionStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}
