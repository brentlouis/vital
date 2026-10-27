/* The VITAL logo, from the brand kit (brand/logo/svg). Three facility circles and the patient,
   solid, where they all meet. Drawn inline so it stays sharp and needs no extra request.
   `tone` picks the version for the surface behind it: light grounds or forest green. */

const CENTRE = 'M80 61.7A50 50 0 0 1 98.3 80A50 50 0 0 1 80 98.3A50 50 0 0 1 61.7 80A50 50 0 0 1 80 61.7Z';
const WORD = 'M0 0H19L46 76L73 0H92L56 100H36Z M114 0H132V100H114Z M154 0H230V18H201V100H183V18H154Z '
  + 'M278 0H302L338 100H319L311 77H269L261 100H242Z M275 60H305L290 18Z M360 0H378V82H430V100H360Z';

type Tone = 'light' | 'dark';

function Symbol({ tone }: { tone: Tone }) {
  const dark = tone === 'dark';
  return (
    <g>
      <circle cx="55" cy="55" r="50" fill="#b1dbb8" fillOpacity={dark ? 0.34 : 0.6} />
      <circle cx="105" cy="55" r="50" fill="#b1dbb8" fillOpacity={dark ? 0.34 : 0.6} />
      <circle cx="55" cy="105" r="50" fill="#b1dbb8" fillOpacity={dark ? 0.34 : 0.6} />
      <circle cx="105" cy="105" r="50" fill={dark ? '#e1f4df' : '#0f3e17'} />
      <path fill={dark ? '#0f3e17' : '#b1dbb8'} d={CENTRE} />
    </g>
  );
}

/** The symbol alone, `size` px square. */
export function LogoMark({ size = 24, tone = 'light' }: { size?: number; tone?: Tone }) {
  return (
    <svg width={size} height={size} viewBox="0 0 160 160" aria-hidden="true" focusable="false">
      <Symbol tone={tone} />
    </svg>
  );
}

/** Symbol and wordmark side by side, `height` px tall. Announced as "VITAL". */
export function Logo({ height = 24, tone = 'light', className }: { height?: number; tone?: Tone; className?: string }) {
  return (
    <svg className={className} height={height} viewBox="0 0 466 120" role="img" aria-label="VITAL">
      <g transform="scale(0.75)"><Symbol tone={tone} /></g>
      <path transform="translate(156 24) scale(0.72)" fill={tone === 'dark' ? '#e1f4df' : '#0f3e17'} fillRule="evenodd" d={WORD} />
    </svg>
  );
}
