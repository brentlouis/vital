import { useId, useMemo, useState, type KeyboardEvent } from 'react';
import { Circle, CircleDot, ClipboardList, ClipboardPlus, Hospital, Plus, Search, Send, UserRound, X } from 'lucide-react';
import { BackButton, Button, ConfirmDialog, Icon, type DialogSpec } from '../ui';
import { AutoTimeField } from '../AutoTimeField';
import { FACILITY_PLAN, PEOPLE, TEST_META, givenFirst, travelMinutes, type Person, type RankedFacility } from '../../domain/reference';
import { fmtSlot } from '../../domain/time';
import { PRIORITY_REASONS } from '../../domain/types';
import { referralSummary, type ReferralForm as Form } from './useReferralForm';
import { useDemo } from '../../store/context';
import { labTrackRecord } from '../../domain/measures';

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
  const [dialog, setDialog] = useState<DialogSpec | null>(null);
  const patient = PEOPLE.find(p => p.id === form.patientId) ?? null;
  const { state } = useDemo();
  const [sortBy, setSortBy] = useState<'match' | 'fastest' | 'closest'>('match');

  /* Leaving a half-filled form asks first; an untouched one just closes. */
  const leave = () => {
    if (!rf.dirty) { rf.reset(); onDiscard(); return; }
    setDialog({
      title: 'Discard this appointment?',
      body: 'The patient, tests and clinical note you entered are cleared. Nothing has been sent.',
      action: 'Discard', cancel: 'Keep editing',
      onConfirm: () => { setDialog(null); rf.reset(); onDiscard(); },
    });
  };
  /* Premium+ (function 9): the referring facility sees each laboratory's track record from
     VITAL's own records, and can sort by it. The fair order is the default; a plan never
     changes it, it only adds information for the person choosing. */
  const premiumPlus = FACILITY_PLAN[rf.referrer] === 'Premium+';
  const record = premiumPlus ? (lab: string) => labTrackRecord(state, lab, rf.now) : null;
  const order = (list: RankedFacility[]) => {
    if (!record || sortBy === 'match') return list;
    return [...list].sort((a, b) => sortBy === 'closest'
      ? travelMinutes(a.travel) - travelMinutes(b.travel)
      : (record(a.name).medianHours ?? Infinity) - (record(b.name).medianHours ?? Infinity));
  };
  const full = order(create.ranked.filter(f => f.full));
  const partial = order(create.ranked.filter(f => !f.full));

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
        {record && (() => {
          const r = record(f.name);
          return (
            <span className="option__record">
              <span className="tabular">{r.medianHours === null ? 'No results yet' : `Results in ${r.medianHours >= 48 ? `${(r.medianHours / 24).toFixed(1)} days` : `${Math.round(r.medianHours)} h`}`}</span>
              <span className="tabular">{r.decided === 0 ? 'No referrals yet' : `Accepts ${Math.round(r.rate! * 100)}% (${Math.round(r.rate! * r.decided)} of ${r.decided})`}</span>
            </span>
          );
        })()}
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
      {backLabel && <BackButton onClick={leave}>{backLabel}</BackButton>}
      <h1 className="page-title upload__title">Create appointment</h1>
      <p className="page-sub">
        {create.own
          ? `Ordered by ${rf.referrer}. Refer the patient to a partner laboratory, or order the test from this facility's own laboratory.`
          : `Referred by ${rf.referrer}. The receiving laboratory is told as soon as you send it.`}
      </p>
      <div className="create__grid">
        <div className="form steps">
          <section className="step" aria-labelledby="step-1">
            <h2 className="step__title" id="step-1"><span className="step__n">1</span>Patient</h2>
            <PatientPicker patient={patient} onPick={id => setForm({ patientId: id })} onClear={() => setForm({ patientId: '', consent: false })} />
            {form.fromVisit && <p className="muted small m0">Ordered from this patient’s doctor visit, {form.fromVisit}. The patient sees these tests under that visit in their wallet.</p>}
          </section>

          <fieldset className="form__rest" disabled={!patient}>
          {!patient && <span className="field__hint step__locked">Choose the patient first. The rest of the form opens once the patient is confirmed.</span>}
          <section className="step" aria-labelledby="step-2">
          <h2 className="step__title" id="step-2"><span className="step__n">2</span>Tests</h2>
          <div className="field">
            <label className="field__label" htmlFor="test-search">Tests requested</label>
            {create.picked.length > 0 && (
              <div className="choice-row">
                {create.picked.map(n => (
                  <button key={n} type="button" className="toggle" aria-pressed="true" aria-label={`Remove ${n}`} onClick={() => rf.toggleTest(n)}>
                    {n}<Icon icon={X} size={14} />
                  </button>
                ))}
              </div>
            )}
            <TestAdder picked={create.picked} onAdd={rf.toggleTest} />
            <span className="field__hint">
              {create.picked.length ? 'The laboratory list below is filtered and ranked against this selection.' : 'Choose at least one test to see the laboratories that offer it.'}
            </span>
          </div>

          </section>

          <section className="step" aria-labelledby="step-3">
          <h2 className="step__title" id="step-3"><span className="step__n">3</span>Laboratory and time</h2>
          <div className="field">
            <span className="field__label">Receiving laboratory</span>
            {premiumPlus && create.ranked.length > 1 && (
              <div className="lab-sort">
                <label className="field__hint" htmlFor="lab-sort">Sort by</label>
                <select id="lab-sort" className="input input--sm" value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}>
                  <option value="match">Best match (tests offered, then nearest)</option>
                  <option value="fastest">Fastest results</option>
                  <option value="closest">Closest</option>
                </select>
                <span className="field__hint">Premium+: each laboratory's track record, from VITAL's own records.</span>
              </div>
            )}
            {create.own && (
              <>
                <span className="field__hint">This facility</span>
                {ownOption()}
                <span className="field__hint field__hint--band">Other laboratories</span>
              </>
            )}
            {full.length > 0 && <span className="field__hint">Offers every test requested</span>}
            {full.map(labOption)}
            {partial.length > 0 && <span className="field__hint field__hint--band">Offers some of the tests requested</span>}
            {partial.map(labOption)}
            {create.picked.length > 0 && create.ranked.length === 0 && !create.own && (
              <span className="field__hint amber">No partner laboratory offers these tests. Change the tests requested.</span>
            )}
          </div>

          <div className="field">
            <span className="field__label">Scheduled time</span>
            <span className="field__hint">
              {create.lab ? 'VITAL picks the time with the shortest wait, or choose one yourself. The laboratory checks it against its own schedule.' : 'Choose a receiving facility first.'}
            </span>
            {create.lab && (
              <AutoTimeField key={create.lab} id="referral-slot" lab={create.lab} tests={create.summary?.included ?? create.picked}
                now={rf.now} value={form.slot} auto={form.autoTime}
                onChange={(m, auto) => setForm({ slot: m, autoTime: auto })} />
            )}
            <span className="field__hint">{form.autoTime
              ? 'If the time does not fit, the laboratory has VITAL pick another and the patient is told.'
              : 'If the time does not fit, the laboratory proposes another and the patient decides.'}</span>
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

          </section>

          <section className="step" aria-labelledby="step-4">
          <h2 className="step__title" id="step-4"><span className="step__n">4</span>Note and consent</h2>
          <label className="field">
            <span className="field__label">Clinical note <span className="field__req">required</span></span>
            <textarea className="input input--area" rows={4} value={form.note} required aria-required="true"
              onChange={e => setForm({ note: e.target.value })}
              placeholder="Why the test is needed, in one or two sentences." />
            <span className="field__hint">The receiving laboratory and the patient both read this note.</span>
          </label>

          <fieldset className="priority-pick">
            <legend className="field__label">Priority <span className="field__opt">optional</span></legend>
            <div className="priority-pick__options" role="radiogroup" aria-label="Priority">
              {[null, ...PRIORITY_REASONS].map(r => (
                <label key={r ?? 'none'} className={form.priority === r ? 'priority-pick__opt is-on' : 'priority-pick__opt'}>
                  <input type="radio" name="priority" checked={form.priority === r} onChange={() => setForm({ priority: r })} />
                  {r ?? 'None'}
                </label>
              ))}
            </div>
            <span className="field__hint">Priority appointments go to the top of the receiving laboratory's queue. Give it for the patient's need, never to move a facility ahead.</span>
          </fieldset>

          {patient && create.lab && (
            <label className="consent-check">
              <input type="checkbox" checked={form.consent} onChange={e => setForm({ consent: e.target.checked })} />
              <span className="consent-check__text">
                <span className="bold">
                  {givenFirst(patient.name)} agreed, here at the counter, to share this appointment and its result with {create.internal ? "this facility's own laboratory" : create.lab}.
                </span>
                <span className="field__hint">Ask before you tick this. Your name is written to the status trail with the patient's agreement.</span>
              </span>
            </label>
          )}
          {patient && create.lab && (
            <label className="consent-check consent-check--optional">
              <input type="checkbox" checked={form.shareHistory} disabled={!form.consent}
                onChange={e => setForm({ shareHistory: e.target.checked })} />
              <span className="consent-check__text">
                <span className="bold">Optional: {givenFirst(patient.name)} also agreed to share their earlier results and the details they entered (such as allergies) with {create.internal ? "this facility's own laboratory" : create.lab}.</span>
                <span className="field__hint">Only if the patient says yes. It ends when this appointment closes, and the patient can stop it sooner from their wallet.</span>
              </span>
            </label>
          )}
          <span className="field__hint">
            {create.internal
              ? "This order stays inside this facility. The patient's wallet still records it and lets them withdraw access later."
              : `The patient's agreement gives ${create.lab || 'the receiving laboratory'} this appointment and its result, nothing else in their record. They can withdraw it later from their health wallet.`}
          </span>
          </section>
          </fieldset>
        </div>

        {/* The appointment as it will be sent, beside the form, with the only button that sends it. */}
        <aside className="send-panel" aria-label="Appointment summary">
          <h2 className="send-panel__title">{create.internal ? 'Internal order' : 'Referral'}</h2>
          <dl className="send-panel__facts">
            <dt>Patient</dt><dd>{patient ? patient.name : <span className="muted">Not chosen</span>}</dd>
            <dt>Tests</dt><dd>{create.summary?.included.length ? create.summary.included.join(', ') : create.picked.length ? create.picked.join(', ') : <span className="muted">None yet</span>}</dd>
            <dt>Laboratory</dt><dd>{create.lab || <span className="muted">Not chosen</span>}</dd>
            <dt>Time</dt><dd>{create.slot !== null ? <span className="tabular">{fmtSlot(create.slot)}</span> : <span className="muted">Not chosen</span>}</dd>
            <dt>Priority</dt><dd>{form.priority ? <span className="priority-text">{form.priority}</span> : 'None'}</dd>
          </dl>
          {!create.ready && create.missing.length > 0 && (
            <p className="send-panel__missing" aria-live="polite">Still needed: {create.missing.join(', ')}.</p>
          )}
          <div className="send-panel__actions">
            <Button size="md" block icon={create.internal ? ClipboardPlus : Send} disabled={!create.ready} onClick={onSend}>
              {create.internal ? 'Place internal order' : 'Send to facility'}
            </Button>
            <Button size="md" block variant="outline" onClick={leave}>Discard</Button>
          </div>
        </aside>
      </div>
      <ConfirmDialog spec={dialog} onClose={() => setDialog(null)} />
    </div>
  );
}

/* Find the patient by name or ID, then confirm them on a card. A list of everyone is never
   offered: picking the wrong person from a long menu is the error this prevents. */
function PatientPicker({ patient, onPick, onClear }: { patient: Person | null; onPick: (id: string) => void; onClear: () => void }) {
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const listId = useId();
  const inputId = useId();
  const matches = useMemo(() => {
    const t = q.trim().toLowerCase().replace(/,/g, '');
    if (t.length < 2) return [];
    return PEOPLE.filter(p => {
      const name = p.name.toLowerCase();
      return name.replace(/,/g, '').includes(t) || name.split(', ').reverse().join(' ').includes(t) || p.id.toLowerCase().includes(t);
    }).slice(0, 6);
  }, [q]);

  if (patient) {
    return (
      <div className="field">
        <span className="field__label">Patient</span>
        <div className="patient-pick">
          <span className="patient-pick__icon"><Icon icon={UserRound} /></span>
          <div className="patient-pick__who">
            <span className="patient-pick__name">{patient.name}</span>
            <span className="muted tabular">{patient.id} · {patient.age} · {patient.sex === 'F' ? 'Female' : 'Male'} · {patient.municipality}</span>
          </div>
          <Button size="md" variant="outline" onClick={() => { setQ(''); onClear(); }}>Change patient</Button>
        </div>
        <span className="field__hint">Check the name, ID and age with the patient before you go on.</span>
      </div>
    );
  }

  const pick = (p: Person) => { onPick(p.id); setQ(''); setActive(0); };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!matches.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => (i + 1) % matches.length); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive(i => (i - 1 + matches.length) % matches.length); }
    if (e.key === 'Enter') { e.preventDefault(); pick(matches[Math.min(active, matches.length - 1)]); }
  };
  const open = matches.length > 0;
  const typed = q.trim();
  return (
    <div className="field">
      <label className="field__label" htmlFor={inputId}>Patient</label>
      <div className="patient-search">
        <span className="patient-search__icon"><Icon icon={Search} size={16} /></span>
        <input id={inputId} className="input patient-search__input" value={q} autoComplete="off"
          role="combobox" aria-expanded={open} aria-controls={listId} aria-autocomplete="list"
          aria-activedescendant={open ? `${listId}-${Math.min(active, matches.length - 1)}` : undefined}
          placeholder="Type a name or patient ID" onChange={e => { setQ(e.target.value); setActive(0); }} onKeyDown={onKey} />
      </div>
      {open && (
        <ul className="patient-results" id={listId} role="listbox" aria-label="Matching patients">
          {matches.map((p, i) => (
            <li key={p.id} id={`${listId}-${i}`} role="option" aria-selected={i === active}
              className={i === active ? 'patient-results__item is-active' : 'patient-results__item'}
              onMouseDown={e => { e.preventDefault(); pick(p); }} onMouseEnter={() => setActive(i)}>
              <span className="patient-results__name">{p.name}</span>
              <span className="muted tabular">{p.id} · {p.age} · {p.municipality}</span>
            </li>
          ))}
        </ul>
      )}
      {typed.length >= 2 && !open && (
        <span className="field__hint">No patient matches "{typed}". Check the spelling, or search by patient ID.</span>
      )}
      {typed.length < 2 && (
        <span className="field__hint">Type at least two letters. Not registered here? Find them on the patient search screen.</span>
      )}
    </div>
  );
}

/* Tests are searched and added: a real catalogue has hundreds. */
function TestAdder({ picked, onAdd }: { picked: string[]; onAdd: (name: string) => void }) {
  const [q, setQ] = useState('');
  const t = q.trim().toLowerCase();
  const hits = TEST_META.filter(m => !picked.includes(m.name)
    && (!t || m.name.toLowerCase().includes(t) || m.long.toLowerCase().includes(t))).slice(0, 6);
  return (
    <div className="test-adder">
      <input id="test-search" className="input" type="search" value={q} placeholder="Search tests by name, e.g. CBC" onChange={e => setQ(e.target.value)} />
      <div className="choice-row">
        {hits.map(m => (
          <button key={m.name} type="button" className="toggle" onClick={() => { onAdd(m.name); setQ(''); }}>
            <Icon icon={Plus} size={14} />{m.name}
          </button>
        ))}
        {!hits.length && <span className="muted small">No test matches “{q}”.</span>}
      </div>
    </div>
  );
}

