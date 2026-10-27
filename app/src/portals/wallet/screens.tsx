import { plainTests } from '../../domain/reference';
import type { Appointment } from '../../domain/view';
import { ago, dayIndex, fmt, fmtDay, fmtTime } from '../../domain/time';
import type { Estimate } from '../../domain/estimate';
import { MBack, MBadge, MButton, MHead, Ms } from '../../components/Phone';
import { TAB_LABEL, noteSkin, plain, skin, type BookingSummary, type Wallet } from './useWallet';

/* ---------- Shared pieces ---------- */

export function SummaryBlock({ summary }: { summary: BookingSummary }) {
  const excluded = [summary.notOffered, summary.referral].filter(Boolean);
  const count = (summary.notOffered ? summary.notOffered.split(', ').length : 0)
    + (summary.referral ? summary.referral.split(', ').length : 0);
  return (
    <>
      <span className="strong">{summary.headline}</span>
      <span>Included — {summary.included || 'nothing'}</span>
      {excluded.length > 0 && (
        <div className="mstack mstack--4">
          <span className="muted">Not included:</span>
          {summary.notOffered && <span>· {summary.notOffered} — not offered here</span>}
          {summary.referral && <span>· {summary.referral} — referral required from your health centre</span>}
          <span className="muted">
            {count > 1 ? 'You’ll need separate appointments for these.' : 'You’ll need a separate appointment for this.'}
          </span>
        </div>
      )}
    </>
  );
}

function StatusPill({ r }: { r: Appointment }) {
  const p = plain(r.status, r.lab, false, r);
  return <MBadge glyph={p.glyph} tone={skin(r.status).tone}>{p.badge}</MBadge>;
}

/* ---------- P2 Detail ---------- */

/* One appointment: where it stands, when and where, the one thing to do, then the history
   for anyone who wants it. */
export function Detail({ w, sel }: { w: Wallet; sel: Appointment }) {
  const p = plain(sel.status, sel.lab, false, sel);
  const summary = w.summaries[sel.id];
  /* Tests the doctor ordered at this visit, and the visit a test was ordered from. */
  const ordered = sel.visit ? w.referrals.filter(r => r.fromVisit === sel.id) : [];
  const fromVisit = sel.fromVisit ? w.referrals.find(r => r.id === sel.fromVisit) : undefined;
  /* The patient sees the steps that stand; a step staff took back by mistake is left out. */
  const trail = sel.trail.filter(e => !e.withdrawn && !e.withdrawal).reverse();
  const nothingToDo = ['Sent', 'Received', 'Booked'].includes(sel.status);
  return (
    <div className="screen">
      <MBack onClick={() => w.setScreen(w.tab)}>{TAB_LABEL[w.tab] ?? 'Home'}</MBack>
      <div className="mhead">
        <StatusPill r={sel} />
        <h1 className="mtitle">{plainTests(sel.record.tests)}</h1>
        <p className="mlead">{p.line}{nothingToDo ? ` You do not need to do anything. ${sel.lab} will tell you when to come in.` : ''}</p>
      </div>

      <dl className="mfacts">
        <div><dt>When</dt><dd className="tabular">{sel.scheduledAt}</dd></div>
        <div><dt>Where</dt><dd>{sel.lab}</dd></div>
        <div><dt>{sel.visit ? 'Booked by' : 'Asked for by'}</dt><dd>{sel.origin === 'Personal' ? 'You booked this yourself' : sel.fromFacility || w.rhu}</dd></div>
        {sel.visit && sel.note && <div><dt>You said</dt><dd>{sel.note}</dd></div>}
      </dl>

      {sel.priority && <p className="mpriority"><Ms glyph="priority_high" size={18} />Priority · {sel.priority}. You will be seen first.</p>}

      {(() => { const e = w.estimate(sel); return e ? <EstimatePanel e={e} now={w.now} /> : null; })()}

      {fromVisit && (
        <button type="button" className="mstart" onClick={() => w.openAppointment(fromVisit)}>
          <span className="mfile"><Ms glyph="stethoscope" /></span>
          <span className="mentry__text">
            <span className="mentry__title">Ordered at your doctor visit</span>
            <span className="mentry__line">{fromVisit.lab}</span>
            <span className="mentry__line mentry__line--muted tabular">{fromVisit.scheduledAt}</span>
          </span>
          <Ms glyph="chevron_right" className="mentry__chev" />
        </button>
      )}

      {sel.visit && ['Completed', 'Patient arrived'].includes(sel.status) && (
        <section className="msection">
          <h2 className="mh2">Tests from this visit</h2>
          {ordered.length ? (
            <div className="mentries mentries--card">
              {ordered.map(r => (
                <button key={r.id} type="button" className="mentry" onClick={() => w.openAppointment(r)}>
                  <span className="mfile"><Ms glyph="biotech" /></span>
                  <span className="mentry__text">
                    <span className="mentry__title">{plainTests(r.record.tests)}</span>
                    <span className="mentry__line" title={r.lab}>{r.lab}</span>
                    <span className="mentry__line mentry__line--muted tabular">{r.scheduledAt}</span>
                    <StatusPill r={r} />
                  </span>
                  <Ms glyph="chevron_right" className="mentry__chev" />
                </button>
              ))}
            </div>
          ) : (
            <p className="mempty">{sel.status === 'Completed' ? 'The doctor did not order any tests.' : 'Any tests the doctor orders appear here.'}</p>
          )}
        </section>
      )}

      {sel.status === 'Reschedule proposed' && (
        <div className="mnotice mnotice--amber">
          <span className="strong amber">{sel.lab} proposed a new time</span>
          <span className="tabular">{sel.proposedSlot}</span>
          <span className="muted">{sel.respondCountdown}</span>
          <MButton className="mbtn--start" onClick={() => w.setScreen('proposed')}>See the new time</MButton>
        </div>
      )}

      {sel.result && ['Endorsed', 'Completed'].includes(sel.status) && <ResultPanel w={w} sel={sel} />}

      {summary && <div className="mpanel mpanel--12"><SummaryBlock summary={summary} /></div>}

      <details className="mhistory">
        <summary className="mhistory__summary">What has happened <span className="muted">({trail.length})</span></summary>
        <ol className="mtrail">
          {trail.map((e, i) => {
            const q = plain(e.status, sel.lab, true, sel);
            return (
              <li key={i} className="mpoint">
                <Ms glyph={q.glyph} size={20} className={`${skin(e.status).hue} pt2`} />
                <div className="mstack mstack--0">
                  <span>{q.line}</span>
                  <span className="mfine tabular">{e.at}</span>
                </div>
              </li>
            );
          })}
        </ol>
      </details>
    </div>
  );
}

/* How long the patient will likely wait, and when results will be ready: a range, with what it
   rests on. A wait shows only at facilities busy enough to queue. */
function EstimatePanel({ e, now }: { e: Estimate; now: number }) {
  const r = e.result;
  const when = r && (dayIndex(r.from) === dayIndex(now) && !r.overnight
    ? `today, ${fmtTime(r.from)}–${fmtTime(r.to)}`
    : `${fmtDay(r.from)}, ${fmtTime(r.from)}–${dayIndex(r.to) === dayIndex(r.from) ? fmtTime(r.to) : `${fmtDay(r.to)} ${fmtTime(r.to)}`}`);
  return (
    <div className="mestimate">
      {e.wait && (
        <div className="mestimate__row">
          <Ms glyph="schedule" size={20} className="forest" />
          <span><span className="strong">About {e.wait.minutes} min wait</span> <span className="muted">· {e.wait.ahead} ahead of you</span></span>
        </div>
      )}
      {r && (
        <div className="mestimate__row">
          <Ms glyph="lab_research" size={20} className="forest" />
          <span><span className="strong">Results expected {when}</span><span className="muted"> · we'll notify you</span></span>
        </div>
      )}
      <span className="mfine">{e.basis}</span>
    </div>
  );
}

/* The released result. VITAL shows the document; it never explains what it means. */
function ResultPanel({ w, sel }: { w: Wallet; sel: Appointment }) {
  const openedAt = w.opened[sel.id];
  const personal = sel.origin === 'Personal';
  const closer = sel.origin === 'Internal' ? sel.fromFacility : sel.fromFacility || w.rhu;
  return (
    <div className="mcard mcard--16">
      <div className="mrow mrow--flat">
        <Ms glyph="description" className="forest" />
        <div className="mrow__text">
          <span className="strong">{plainTests(sel.record.tests)} result</span>
          <span className="muted">{sel.lab}</span>
          <span className="mfine">Released <span className="tabular">{sel.result!.released}</span></span>
        </div>
      </div>
      <MButton onClick={() => w.openResult(sel)}><Ms glyph="open_in_new" />Open result</MButton>
      {openedAt !== undefined && <span className="mfine">You opened this result on <span className="tabular">{fmt(openedAt)}</span>.</span>}
      <div className="mpanel mpanel--4">
        <span className="strong">What happens next</span>
        <span>
          {personal
            ? sel.status === 'Endorsed'
              ? 'You booked this yourself, so opening the result finishes the appointment. Show it to a doctor or your health centre, who can tell you what it means.'
              : 'Show this result to a doctor or your health centre. They can tell you what it means for you.'
            : sel.status === 'Endorsed'
              ? `${closer} ordered this test and will read the result. They will contact you if you need to come back. You do not need to do anything now.`
              : `${closer} has read this result. If you have questions about it, ask them on your next visit or call them.`}
        </span>
      </div>
    </div>
  );
}

/* ---------- P5 Revoke ---------- */

export function Revoke({ w }: { w: Wallet }) {
  const rv = w.revoke;
  if (!rv) return null;
  const consequence = rv.kind === 'Referring provider'
    ? 'They are the health centre that refers you. They will not be able to send new appointments or read results for you until you share again.'
    : 'The appointment they are working on will be closed. If you still need the test, your health centre will have to send a new appointment.';
  return (
    <div className="screen">
      <MBack onClick={() => w.setScreen('consent')}>Who can see your record</MBack>
      <div className="mstack mstack--16">
        <h1 className="mtitle">Stop sharing with {rv.facility}?</h1>
        <div className="mnotice mnotice--clay">
          <span>{rv.facility} will no longer be able to open your record.</span>
          <span>{consequence}</span>
          <span>Anything they have already read stays with them. Your record keeps a note that you stopped sharing, with today's date.</span>
        </div>
        <p className="mlead mlead--muted">You can grant access again later. A new appointment will ask you again.</p>
        {rv.active ? (
          <div className="mstack">
            <MButton variant="danger" onClick={w.confirmRevoke}>Stop sharing</MButton>
            <MButton variant="quiet" onClick={() => w.setScreen('consent')}>Keep sharing</MButton>
          </div>
        ) : (
          <p className="mlead">You already stopped sharing with {rv.facility}.</p>
        )}
      </div>
    </div>
  );
}

/* ---------- P10 Notifications ---------- */

export function Notifications({ w }: { w: Wallet }) {
  return (
    <div className="screen">
      <MHead title="Notifications">
        <p className="mlead mlead--muted">Newest first. You are told when a facility acts on your appointment, and once the day before.</p>
      </MHead>
      <div className="mstack mstack--0">
        {w.notes.map((n, i) => {
          const k = noteSkin(n);
          const unread = n.at > w.seenAt;
          const r = w.referrals.find(x => x.id === n.appointmentId);
          return (
            <button key={i} type="button" className="mnote" onClick={() => r && w.openAppointment(r)}>
              <Ms glyph={k.glyph} className={`${k.hue} pt2`} />
              <span className="mnote__body">
                <span className="mnote__tags">
                  <span className={`mchip ${k.hue}`}><Ms glyph={k.glyph} size={14} />{n.kind}</span>
                  {unread && <span className="pill-new">New</span>}
                </span>
                <span className={unread ? 'strong' : undefined}>{n.message}</span>
                <span className="mfine">{ago(w.now, n.at)}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- P11 Reschedule proposed ---------- */

export function Proposed({ w, sel }: { w: Wallet; sel: Appointment }) {
  const open = sel.status === 'Reschedule proposed';
  return (
    <div className="screen">
      <MBack onClick={() => w.setScreen(w.tab)}>{TAB_LABEL[w.tab] ?? 'Home'}</MBack>
      <div className="mhead">
        <h1 className="mtitle">A new time has been proposed</h1>
        <MBadge glyph="event_repeat" tone="attention">New time proposed</MBadge>
        <p className="mlead">{sel.lab} cannot do the time you chose. You decide what happens next — nobody else can accept this for you.</p>
      </div>

      {open ? (
        <>
          <div className="mnotice mnotice--amber mnotice--16">
            <div className="mkv">
              <span className="mfield-label">Your original time</span>
              <span className="strike tabular">{sel.scheduledAt}</span>
            </div>
            <div className="mkv">
              <span className="mfield-label">Proposed time</span>
              <span className="proposed tabular">{sel.proposedSlot}</span>
            </div>
            <span className="muted">{sel.respondCountdown}</span>
            <span>If you do not answer in time, the appointment goes back to the facility as declined, with the reason "No response to proposed time."</span>
          </div>

          <div className="mpanel mpanel--16">
            <div className="mkv"><span className="mfield-label">Facility</span><span className="strong">{sel.lab}</span></div>
            <div className="mkv"><span className="mfield-label">Tests</span><span className="strong">{sel.test}</span></div>
          </div>

          <div className="mstack">
            <MButton onClick={w.acceptProposed}>Accept new time</MButton>
            <MButton variant="quiet" onClick={w.rebookElsewhere}>Choose another facility</MButton>
          </div>
        </>
      ) : (
        <div className="mpanel">There is no proposed time waiting for you on this appointment.</div>
      )}
    </div>
  );
}
