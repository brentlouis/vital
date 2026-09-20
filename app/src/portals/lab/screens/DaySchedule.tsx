import type { KeyboardEvent } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button, Callout, OriginChip, StatusBadge, Tabs } from '../../../components/ui';
import { STATUS_META } from '../../../domain/status';
import { fmtDay, fmtTime } from '../../../domain/time';
import type { Lab } from '../useLab';

/* L6 — the facility's published slots for one day. Also the picker when proposing a new
   time: each slot header gains a "Propose this time" button. */
export function DaySchedule({ lab }: { lab: Lab }) {
  const { day, proposeFor } = lab;
  const picking = !!proposeFor;

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
      {day.days.length === 0 && (
        <p className="muted">This facility has not published any times for the coming days.</p>
      )}

      {proposeFor && (
        <Callout tone="amber" icon={RotateCcw} title="Propose a new time">
          <p>Choose a new time for {proposeFor.patient} · {proposeFor.test}. The patient has 48 hours to accept it.</p>
          <Button variant="outline" className="self-start" onClick={lab.cancelPropose}>Keep the original time</Button>
        </Callout>
      )}

      <div className="table-card">
        {day.slots.map(slot => (
          <div key={slot.slot}>
            <div className="slot__head">
              <span className="slot__time tabular">{fmtTime(slot.slot)}</span>
              <span className="slot__count">
                {slot.items.length === 0 ? 'Open' : slot.items.length === 1 ? '1 appointment' : `${slot.items.length} appointments`}
              </span>
              {picking && slot.published && slot.slot !== proposeFor?.slot && (
                <Button className="slot__propose" onClick={() => lab.proposeSlot(slot.slot)}>Propose this time</Button>
              )}
            </div>
            {slot.items.map(r => {
              const open = () => lab.openDetail(r.id);
              const onKey = (e: KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
              };
              return (
                <div key={r.id} tabIndex={0} role="button" onClick={open} onKeyDown={onKey}
                  className={`slot__row accent--${STATUS_META[r.status].accent}`}>
                  <span className="slot__patient">{r.patient}</span>
                  <span>{r.test}</span>
                  <span className="self-start-x"><OriginChip origin={r.origin} /></span>
                  <span className="self-start-x"><StatusBadge status={r.status} /></span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <p className="footnote">These are the times this facility publishes. The patient's booking screen and the health centre's referral screen offer these same times, so accepting an appointment confirms a time this facility already said it could keep. Slots are synthetic; this prototype does not manage capacity.</p>
    </div>
  );
}
