import { Circle, CircleDot, ClipboardList, ClipboardPlus, Handshake, Hospital, Send, Square, SquareCheck } from 'lucide-react';
import { BackButton, Button, Icon } from '../ui';
import { PEOPLE, type RankedFacility } from '../../domain/reference';
import { fmtSlot } from '../../domain/time';
import { referralSummary, type ReferralForm as Form } from './useReferralForm';

/* R2 — create an appointment. Tests first, then a ranked list of laboratories that offer
   them, then only the times the chosen laboratory has published. Shared by the RHU portal and
   the laboratory portal of a clinic that both refers and receives; the clinic also sees its
   own laboratory, for an internal order. */
export function ReferralForm({ rf, onSend, onDiscard, backLabel }: {
  rf: Form; onSend: () => void; onDiscard: () => void;
  /** Shows a back link above the title when the form is reached from a queue. */
  backLabel?: string;
}) {
  const { form, setForm, create } = rf;
  const full = create.ranked.filter(f => f.full);
  const partial = create.ranked.filter(f => !f.full);

  const labOption = (f: RankedFacility) => {
    const on = create.lab === f.name;
    const s = referralSummary(f, create.picked);
    return (
      <button key={f.name} type="button" className="option" aria-pressed={on} onClick={() => setForm({ lab: f.name })}>
        <span className="option__radio"><Icon icon={on ? CircleDot : Circle} size={16} /></span>
        <span className="option__text">
          <span className="option__name">{f.name}</span>
          <span className="option__meta">{f.municipality} · {f.travel}</span>
          <span className="option__books">
            Sends {s.included.length} of {s.total} {s.total === 1 ? 'test' : 'tests'} — {s.included.join(', ')}
          </span>
          {s.notOffered.length > 0 && <span className="option__warn">Not included: {s.notOffered.join(', ')} — not offered here</span>}
          {s.referralOnly.length > 0 && (
            <span className="option__meta">Accepts {s.referralOnly.join(', ')} only on a health-centre referral — this appointment is one</span>
          )}
        </span>
        {f.partner && (
          <span className="chip option__end"><Icon icon={Handshake} size={14} />Partner facility</span>
        )}
      </button>
    );
  };

  /* The facility's own laboratory. Choosing it makes this an internal order, not a referral. */
  const ownOption = () => {
    if (!create.own) return null;
    const { facility: f, summary: s } = create.own;
    const on = create.internal;
    return (
      <button type="button" className="option" aria-pressed={on} onClick={() => setForm({ lab: f.name })}>
        <span className="option__radio"><Icon icon={on ? CircleDot : Circle} size={16} /></span>
        <span className="option__text">
          <span className="option__name">{f.name} <span className="muted">· this facility</span></span>
          <span className="option__books">
            Orders {s.included.length} of {s.total} {s.total === 1 ? 'test' : 'tests'} in-house — {s.included.join(', ')}
          </span>
          {s.notOffered.length > 0 && <span className="option__warn">Not included: {s.notOffered.join(', ')} — not offered here</span>}
        </span>
        <span className="chip option__end"><Icon icon={Hospital} size={14} />Internal order</span>
      </button>
    );
  };

  const s = create.summary;
  const n = s ? `${s.included.length} of ${s.total} ${s.total === 1 ? 'test' : 'tests'}` : '';

  return (
    <div className="create">
      {backLabel && <BackButton onClick={onDiscard}>{backLabel}</BackButton>}
      <h1 className="page-title upload__title">Create appointment</h1>
      <p className="page-sub">
        {create.own
          ? `Ordered by ${rf.referrer}. Refer the patient to a partner laboratory, or order the test from this facility's own laboratory.`
          : `Referred by ${rf.referrer}. The receiving laboratory is told as soon as you send it.`}
      </p>
      <div className="create__grid">
        <div className="card form">
          <label className="field">
            <span className="field__label">Patient</span>
            <select className="input" value={form.patientId} onChange={e => setForm({ patientId: e.target.value })}>
              {PEOPLE.map(p => (
                <option key={p.id} value={p.id}>{p.name} · {p.id} · {p.age} · {p.municipality}</option>
              ))}
            </select>
            <span className="field__hint">Not in this list? Search across facilities on the patient search screen.</span>
          </label>

          <div className="field">
            <span className="field__label">Tests requested</span>
            <div className="choice-row">
              {create.tests.map(t => {
                const on = create.picked.includes(t.name);
                return (
                  <button key={t.name} type="button" className="toggle" aria-pressed={on} onClick={() => rf.toggleTest(t.name)}>
                    <Icon icon={on ? SquareCheck : Square} size={16} />{t.name}
                  </button>
                );
              })}
            </div>
            <span className="field__hint">The laboratory list below is filtered and ranked against this selection.</span>
          </div>

          <div className="field">
            <span className="field__label">Receiving laboratory</span>
            {create.own && (
              <>
                <span className="field__hint">This facility</span>
                {ownOption()}
                <span className="field__hint field__hint--band">Partner laboratories</span>
              </>
            )}
            {full.length > 0 && <span className="field__hint">Offers every test requested</span>}
            {full.map(labOption)}
            {partial.length > 0 && <span className="field__hint field__hint--band">Offers some of the tests requested</span>}
            {partial.map(labOption)}
            {create.ranked.length === 0 && (
              <span className="field__hint amber">No partner laboratory offers these tests. Change the tests requested.</span>
            )}
            <span className="field__hint">Laboratories that offer every test requested are always listed first. A partner listing only reorders laboratories inside a band.</span>
          </div>

          <div className="field">
            <span className="field__label">Scheduled time</span>
            <span className="field__hint">
              {create.lab ? `Times published by ${create.lab}` : 'Choose a receiving facility to see the times it has published.'}
            </span>
            <div className="choice-row">
              {create.slots.map(m => (
                <button key={m} type="button" className="slot-chip tabular" aria-pressed={create.slot === m}
                  onClick={() => setForm({ slot: m })}>{fmtSlot(m)}</button>
              ))}
            </div>
            {create.lab && create.slots.length === 0 && (
              <span className="field__hint amber">{create.lab} has not published any times for the coming days.</span>
            )}
            <span className="field__hint">Only times the receiving facility has published can be chosen, so the facility is confirming a slot it already offered rather than judging an arbitrary one. Slots are synthetic; this prototype does not manage capacity.</span>
          </div>

          {create.summary && (
            <div className="sent-summary" aria-live="polite">
              <span className="sent-summary__icon"><Icon icon={ClipboardList} /></span>
              <div className="sent-summary__body">
                <span className="bold forest">
                  {create.internal ? `Ordering ${n} in-house at ${create.summary.lab}` : `Sending ${n} to ${create.summary.lab}`}
                </span>
                <span>Included — {create.summary.included.join(', ')}</span>
                {create.internal && (
                  <span className="muted">
                    An internal order is not sent anywhere: it goes straight to this laboratory's accepted list for the time chosen above. It is not counted in the referral turnaround measure.
                  </span>
                )}
                {!create.internal && create.summary.referralOnly.length > 0 && (
                  <span className="muted">
                    {create.summary.referralOnly.join(', ')} {create.summary.referralOnly.length === 1 ? 'is' : 'are'} accepted here only on a health-centre referral. This appointment is that referral.
                  </span>
                )}
                {create.summary.notOffered.length > 0 && (
                  <div className="sent-summary__excluded">
                    <span className="muted">Not included:</span>
                    {create.summary.notOffered.map(t => (
                      <span key={t}>· {t} — not offered at {create.summary!.lab}</span>
                    ))}
                    <span className="muted">
                      {create.summary.notOffered.length > 1
                        ? 'Create separate appointments for these at a laboratory that offers them.'
                        : 'Create a separate appointment for this at a laboratory that offers it.'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <label className="field">
            <span className="field__label">Clinical note</span>
            <textarea className="input input--area" rows={4} value={form.note} onChange={e => setForm({ note: e.target.value })}
              placeholder="Why the test is needed, in one or two sentences." />
            <span className="field__hint">The receiving laboratory and the patient both read this note.</span>
          </label>

          <div className="form__actions">
            <Button size="md" icon={create.internal ? ClipboardPlus : Send} disabled={!create.lab || create.slot === null || !create.summary?.included.length} onClick={onSend}>
              {create.internal ? 'Place internal order' : 'Send to facility'}
            </Button>
            <Button size="md" variant="outline" onClick={onDiscard}>Discard</Button>
          </div>
        </div>

        <aside className="side-note">
          <span className="side-note__title">Consent</span>
          {create.internal ? (
            <>
              <span>This order stays inside {create.lab}. No other facility is asked for access.</span>
              <span>The patient's health wallet still records the appointment and asks them to grant this facility access to it and its result, as for any appointment.</span>
            </>
          ) : (
            <>
              <span>Sending this appointment asks the patient's health wallet to grant {create.lab || 'the receiving laboratory'} access to this appointment and its result.</span>
              <span>The laboratory cannot open the record until the patient grants access.</span>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
