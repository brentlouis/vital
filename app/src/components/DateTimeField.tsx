import { useState } from 'react';
import { BASE, toDate, type Minute } from '../domain/time';

/* "2026-09-16" and "08:30" for date and time inputs. */
function isoDate(m: Minute): string {
  const d = toDate(m);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function isoTime(m: Minute): string {
  const d = toDate(m);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/* A date and a time, chosen freely. VITAL does not keep facility timetables: the receiving
   staff check the time against their own schedule, then accept it or propose another. */
export function DateTimeField({ id, now, value, onChange, onDate, exclude, mobile }: {
  id: string;
  now: Minute;
  value: Minute | null;
  onChange: (m: Minute | null) => void;
  /** The day alone, as soon as it is chosen ("2026-09-16"). */
  onDate?: (d: string) => void;
  /** A time that cannot be chosen again, such as the current slot when proposing a new one. */
  exclude?: Minute;
  /** Wallet styling instead of the staff portals'. */
  mobile?: boolean;
}) {
  const [date, setDate] = useState(() => (value !== null ? isoDate(value) : ''));
  const [time, setTime] = useState(() => (value !== null ? isoTime(value) : ''));
  const label = mobile ? 'mfield-label' : 'field__label';
  const input = mobile ? 'minput minput--48' : 'input';

  const pick = (d: string, t: string) => {
    if (!d || !t) { onChange(null); return; }
    const m = Math.round((new Date(`${d}T${t}`).getTime() - BASE) / 60000);
    onChange(m > now && m !== exclude ? m : null);
  };
  const chosen = date && time ? Math.round((new Date(`${date}T${time}`).getTime() - BASE) / 60000) : null;
  const problem = chosen === null ? null
    : chosen <= now ? 'Choose a time later than now.'
      : chosen === exclude ? 'That is the current time. Choose a different one.' : null;

  return (
    <div className={mobile ? 'mdatetime' : 'datetime'}>
      <div className={mobile ? 'mkv' : 'field'}>
        <label className={label} htmlFor={`${id}-date`}>Date</label>
        <input id={`${id}-date`} className={input} type="date" value={date} min={isoDate(now)}
          onChange={e => { setDate(e.target.value); onDate?.(e.target.value); pick(e.target.value, time); }} />
      </div>
      <div className={mobile ? 'mkv' : 'field'}>
        <label className={label} htmlFor={`${id}-time`}>Time</label>
        <input id={`${id}-time`} className={input} type="time" step={900} value={time}
          onChange={e => { setTime(e.target.value); pick(date, e.target.value); }} />
      </div>
      {problem && <span className={mobile ? 'mfine clay' : 'field__hint clay'}>{problem}</span>}
    </div>
  );
}
