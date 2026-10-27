import { VISIT_FACILITIES } from '../../domain/reference';
import { fmtSlot, type Minute } from '../../domain/time';
import { DateTimeField } from '../../components/DateTimeField';
import { MBack, MBadge, MButton, MHead, Ms } from '../../components/Phone';
import type { Wallet } from './useWallet';

/* Booking starts with what the patient knows. Most do not know which tests they need, so
   the first choice is a doctor visit; the doctor orders any tests from it. Patients who
   already have a lab request book the tests directly. */

/* ---------- P6a How to book ---------- */

export function BookStart({ w }: { w: Wallet }) {
  return (
    <div className="screen">
      <MBack onClick={() => w.setScreen('appointments')}>Appointments</MBack>
      <MHead title="What do you need?" />
      <div className="mstack">
        <button type="button" className="mstart" onClick={() => w.startVisit()}>
          <span className="mfile"><Ms glyph="stethoscope" /></span>
          <span className="mentry__text">
            <span className="mentry__title">See a doctor</span>
            <span className="mentry__meta">For a check-up, or if you feel unwell and are not sure what you need. The doctor orders any tests.</span>
          </span>
          <Ms glyph="chevron_right" className="mentry__chev" />
        </button>
        <button type="button" className="mstart" onClick={() => w.setScreen('bookTests')}>
          <span className="mfile"><Ms glyph="biotech" /></span>
          <span className="mentry__text">
            <span className="mentry__title">I have a lab request</span>
            <span className="mentry__meta">You already know which tests to take, for example from a doctor’s request slip.</span>
          </span>
          <Ms glyph="chevron_right" className="mentry__chev" />
        </button>
      </div>
    </div>
  );
}

/* ---------- P6b Book a doctor visit ---------- */

export function BookVisit({ w }: { w: Wallet }) {
  const { visit } = w;
  const slot = visit.slot !== null && visit.slot > w.now ? visit.slot : null;
  return (
    <div className="screen">
      <MBack onClick={() => w.setScreen('bookStart')}>What do you need?</MBack>
      <MHead title="See a doctor">
        <p className="mlead">Choose where to go and a time. You can say what it is about, but you do not have to.</p>
      </MHead>

      <div className="mstack">
        <h2 className="mh2">Where</h2>
        {VISIT_FACILITIES.map(f => (
          <button key={f.name} type="button" className="mfacility" aria-pressed={visit.facility === f.name}
            onClick={() => w.setVisit({ facility: f.name, slot: null })}>
            <span className="strong">{f.name}</span>
            <span className="muted">{f.municipality} · {f.travel}</span>
            <span>{f.doctors}</span>
            {f.healthCentre && <span className="mchip"><Ms glyph="local_hospital" size={14} />Your health centre</span>}
          </button>
        ))}
        <p className="mfine m0">Nearest first. No facility can pay to be listed higher.</p>
      </div>

      <div className="mstack">
        <h2 className="mh2">When</h2>
        {visit.facility
          ? <SlotPicker id="visit-slot" now={w.now} value={visit.slot} onPick={m => w.setVisit({ slot: m })} />
          : <p className="mlead mlead--muted">Choose where to go first.</p>}
        {visit.facility && <p className="mfine m0">{visit.facility} checks the time against its schedule. If it does not fit, they propose another and you decide.</p>}
      </div>

      <div className="mstack mstack--8">
        <label htmlFor="visit-reason" className="strong">What is it about? (optional)</label>
        <textarea id="visit-reason" className="minput" rows={3} value={visit.reason}
          onChange={e => w.setVisit({ reason: e.target.value })} placeholder="For example: cough for a week, check-up, blood pressure" />
        <span className="mfine">Only the facility you choose sees this.</span>
      </div>

      <MButton disabled={!visit.facility || slot === null} onClick={w.confirmVisit}>Book doctor visit</MButton>
    </div>
  );
}

/* ---------- P8b Visit booked ---------- */

export function VisitBooked({ w }: { w: Wallet }) {
  const { visit } = w;
  const f = VISIT_FACILITIES.find(x => x.name === visit.facility);
  return (
    <div className="screen">
      <div className="mhead">
        <h1 className="mtitle">Your doctor visit is booked</h1>
        <MBadge glyph="event_available" tone="waiting">Booked</MBadge>
        <p className="mlead">You will be told when {visit.facility} confirms it. If the doctor orders tests, they appear under this visit.</p>
      </div>
      <div className="mpanel mpanel--16">
        <div className="mkv">
          <span className="mfield-label">Where</span>
          <span className="strong">{visit.facility}</span>
          {f && <span className="muted">{f.municipality} · {f.travel}</span>}
        </div>
        <div className="mkv"><span className="mfield-label">When</span><span className="strong tabular">{visit.slot !== null ? fmtSlot(visit.slot) : ''}</span></div>
        <div className="mkv"><span className="mfield-label">Reference</span><span className="strong tabular">{visit.id}</span></div>
      </div>
      <MButton onClick={() => w.setScreen('appointments')}>See my appointments</MButton>
    </div>
  );
}

/* A date and a time of the patient's choosing. */
export function SlotPicker({ id, now, value, onPick }: { id: string; now: Minute; value: Minute | null; onPick: (m: Minute | null) => void }) {
  return <DateTimeField id={id} mobile now={now} value={value} onChange={onPick} />;
}
