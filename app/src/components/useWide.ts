import { useEffect, useState } from 'react';

/* True while the window is at least `px` wide; the split workspace needs the room. */
export function useWide(px = 1100): boolean {
  const query = `(min-width: ${px}px)`;
  const [wide, setWide] = useState(() => typeof window === 'undefined' || window.matchMedia(query).matches);
  useEffect(() => {
    const m = window.matchMedia(query);
    const on = () => setWide(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, [query]);
  return wide;
}
