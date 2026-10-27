import { useState } from 'react';
import { DateTimeField } from '../../../components/DateTimeField';
import type { Minute } from '../../../domain/time';
import { RotateCcw, Sparkles } from 'lucide-react';
import { Button, Callout, OriginChip, StatusBadge, Tabs } from '../../../components/ui';
import { STATUS_META } from '../../../domain/status';
import { fmtDay, fmtTime } from '../../../domain/time';
import type { Lab } from '../useLab';

/* L6 — the appointments booked for one day, by time. Also the context when proposing a new
   time: each slot header gains a "Propose this time" button. */
export function DaySchedule({ lab }: { lab: Lab }) {
  const { day, proposeFor } = lab;

  return (
    <div>
      <div className="page-head">
        <h1 className="page-title">Day schedule</h1>
        <span className="muted tabular">{day.label}</span>
        <span className="page-head__end">{day.count} {day.count === 1 ? 'appointment' : 'appointments'}</span>
      </div>

      {day.days.length > 1 && (
        <Tabs label="Day" value={String(Math.min(lab.dayOffset, day.days.length - 1))}
          onChange={v => lab.setDayOffset(Number(v))}
          items={day.days.map((d, i) => ({ id: String(i), label: fmtDay(d.day) }))} />
      )}
      {day.slots.length === 0 && (
        <p className="muted">No appointments on this day.</p>
      )}

      {proposeFor && (
        <Callout tone="amber" icon={RotateCcw} title="Propose a new time">
          <p>Choose a new time for {proposeFor.patient} · {proposeFor.test}. The patient has 48 hours to accept it. The schedule below shows how full each time is.</p>
          <ProposeField lab={lab} />
        </Callout>
      )}

      <div className="table-card">
        {day.slots.map(slot => (
          <div key={slot.slot}>
            <div className="slot__head">
              <span className="slot__time tabular">{fmtTime(slot.slot)}</span>
              <span className="slot__count">
                {slot.items.length === 1 ? '1 appointment' : `${slot.items.length} appointments`}
              </span>
            </div>
            {slot.items.map(r => {
              const open = () => lab.openDetail(r.id);
              return (
                <div key={r.id} onClick={open} className={`slot__row accent--${STATUS_META[r.status].accent}`}>
                  <span className="slot__patient">
                    <button type="button" className="row-link" onClick={e => { e.stopPropagation(); open(); }}>{r.patient}</button>
                  </span>
                  <span>{r.test}</span>
                  <span className="self-start-x"><OriginChip origin={r.origin} /></span>
                  <span className="self-start-x"><StatusBadge status={r.status} /></span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <p className="footnote">Appointments booked with this facility, by time. Patients and referrers choose any time; check each against your own schedule, then accept it or propose another.</p>
    </div>
  );
}

/* The new time as a date and a time, limited to what this facility publishes. */
function ProposeField({ lab }: { lab: Lab }) {
  const target = lab.proposeFor!;
  const suggestion = lab.suggestFor(target);
  /* A time VITAL picked for the patient is only ever re-picked by VITAL. */
  const [mode, setMode] = useState<'auto' | 'manual'>('auto');
  const [slot, setSlot] = useState<Minute | null>(null);
  const auto = target.autoTime || mode === 'auto';
  const chosen = auto ? suggestion?.slot ?? null : slot;
  return (
    <div className="stack-8">
      {!target.autoTime && (
        <div className="autotime__mode" role="radiogroup" aria-label="How the new time is chosen">
          <button type="button" role="radio" aria-checked={mode === 'auto'} className={mode === 'auto' ? 'autotime__opt is-on' : 'autotime__opt'}
            onClick={() => setMode('auto')}><Sparkles size={16} aria-hidden /> Let VITAL pick</button>
          <button type="button" role="radio" aria-checked={mode === 'manual'} className={mode === 'manual' ? 'autotime__opt is-on' : 'autotime__opt'}
            onClick={() => setMode('manual')}>Set manually</button>
        </div>
      )}
      {target.autoTime && <p className="m0">The patient let VITAL pick their time, so the new time is VITAL’s pick too.</p>}
      {auto
        ? (suggestion
          ? <div className="autotime__pick"><Sparkles size={18} aria-hidden /><span><span className="strong tabular">{fmtDay(suggestion.slot)} · {fmtTime(suggestion.slot)}</span> · {suggestion.reason}</span></div>
          : <p className="m0 clay">No open time in the next week.</p>)
        : <DateTimeField id="lab-propose" now={lab.now} value={slot} onChange={setSlot} exclude={target.slot} />}
      <div className="choice-row">
        <Button disabled={chosen === null} onClick={() => chosen !== null && lab.proposeSlot(chosen)}>Propose this time</Button>
        <Button variant="outline" onClick={lab.cancelPropose}>Keep the original time</Button>
      </div>
    </div>
  );
}

