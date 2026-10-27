import { useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { DateTimeField } from './DateTimeField';
import { useDemo } from '../store/context';
import { suggestTime, type Suggestion } from '../domain/estimate';
import { BASE, fmtTime, toDate, type Minute } from '../domain/time';

function isoDate(m: Minute): string {
  const d = toDate(m);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function suggestionLabel(s: Suggestion): string {
  return s.window ? `${fmtTime(s.window.from)}–${fmtTime(s.window.to)}` : fmtTime(s.slot);
}

/* The time of an appointment: VITAL picks it (the default; the person only chooses the day), or
   the person chooses it, with VITAL's suggestion one tap away. Both come from suggestTime. */
export function AutoTimeField({ id, lab, tests, now, value, auto, onChange, mobile }: {
  id: string;
  lab: string;
  tests: string[];
  now: Minute;
  value: Minute | null;
  auto: boolean;
  onChange: (slot: Minute | null, auto: boolean) => void;
  mobile?: boolean;
}) {
  const { state } = useDemo();
  const [date, setDate] = useState(() => (value !== null ? isoDate(value) : ''));
  /* Remounts the free picker when a suggestion is applied, so it shows the new time. */
  const [applied, setApplied] = useState(0);
  const day = date ? Math.round((new Date(`${date}T12:00`).getTime() - BASE) / 60000) : null;
  const suggestion = useMemo(() => (day !== null ? suggestTime(lab, tests, day, state.appointments, now) : null),
    [day, lab, tests, state.appointments, now]);

  const label = mobile ? 'mfield-label' : 'field__label';
  const input = mobile ? 'minput minput--48' : 'input';
  const hint = mobile ? 'mfine' : 'field__hint';
  const pickDay = (d: string) => {
    setDate(d);
    const m = d ? Math.round((new Date(`${d}T12:00`).getTime() - BASE) / 60000) : null;
    const s = m !== null ? suggestTime(lab, tests, m, state.appointments, now) : null;
    if (auto) onChange(s?.slot ?? null, true);
  };

  return (
    <div className="autotime">
      <div className="autotime__mode" role="radiogroup" aria-label="How the time is chosen">
        <button type="button" role="radio" aria-checked={auto} className={auto ? 'autotime__opt is-on' : 'autotime__opt'}
          onClick={() => onChange(suggestion?.slot ?? null, true)}>
          <Sparkles size={16} aria-hidden /> Pick for me
        </button>
        <button type="button" role="radio" aria-checked={!auto} className={!auto ? 'autotime__opt is-on' : 'autotime__opt'}
          onClick={() => onChange(null, false)}>
          Choose a time
        </button>
      </div>

      {auto ? (
        <>
          <div className={mobile ? 'mkv' : 'field'}>
            <label className={label} htmlFor={`${id}-day`}>Day</label>
            <input id={`${id}-day`} className={input} type="date" value={date} min={isoDate(now)}
              onChange={e => pickDay(e.target.value)} />
          </div>
          {suggestion ? (
            <div className="autotime__pick" aria-live="polite">
              <Sparkles size={18} aria-hidden />
              <span><span className="strong tabular">{suggestionLabel(suggestion)}</span> · {suggestion.reason}</span>
            </div>
          ) : date ? <span className={`${hint} clay`}>No open time left that day. Choose another day.</span>
            : <span className={hint}>Choose the day. VITAL picks the time with the shortest wait.</span>}
        </>
      ) : (
        <>
          <DateTimeField key={applied} id={id} now={now} value={value} mobile={mobile}
            onDate={setDate} onChange={m => onChange(m, false)} />
          {suggestion && suggestion.slot !== value && (
            <button type="button" className="autotime__suggest"
              onClick={() => { onChange(suggestion.slot, false); setApplied(k => k + 1); }}>
              <Sparkles size={16} aria-hidden />
              <span>Suggested: <span className="strong tabular">{suggestionLabel(suggestion)}</span> · {suggestion.reason}</span>
              <span className="autotime__use">Use</span>
            </button>
          )}
        </>
      )}
    </div>
  );
}
