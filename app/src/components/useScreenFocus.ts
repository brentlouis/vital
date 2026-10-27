import { useEffect, useRef, type DependencyList } from 'react';

/* When a surface swaps one screen for another in place, the control that was clicked
   disappears and focus would fall back to the page. Instead, scroll to the top and move
   focus to the new screen's heading, so a screen reader announces where the person is and
   the next Tab starts from the content. Only when the screen actually changes: never on
   first load (focus stays where the browser puts it), and not when React runs the effect a
   second time with the same screen in development. */
export function useScreenFocus(deps: DependencyList) {
  const last = useRef<string | null>(null);
  const key = JSON.stringify(deps);
  useEffect(() => {
    const previous = last.current;
    last.current = key;
    if (previous === key) return;
    window.scrollTo(0, 0);
    if (previous === null) return;
    const h = document.querySelector<HTMLElement>('main [data-focus-target]') ?? document.querySelector<HTMLElement>('main h1');
    if (!h) return;
    if (!h.hasAttribute('tabindex')) h.setAttribute('tabindex', '-1');
    h.focus({ preventScroll: true });
  }, [key]);
}

/* Jumps keyboard users past the prototype's screen switcher to the product itself. */
export function skipToMain(e: { preventDefault: () => void }) {
  e.preventDefault();
  const m = document.querySelector<HTMLElement>('main');
  if (!m) return;
  if (!m.hasAttribute('tabindex')) m.setAttribute('tabindex', '-1');
  m.focus();
}
