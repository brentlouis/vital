import { PROFILE, WALLET_PATIENT, givenFirst } from '../../domain/reference';
import type { Appointment } from '../../domain/view';
import { ago, fmt } from '../../domain/time';
import { MBack, MBadge, MButton, MHead, Ms } from '../../components/Phone';
import { noteSkin, plain, skin, type BookingSummary, type Wallet } from './useWallet';

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

/* ---------- P1 Home ---------- */

export function Home({ w }: { w: Wallet }) {
  const activeCount = w.consents.filter(c => c.active).length;
  const word = ['No', 'One', 'Two', 'Three', 'Four', 'Five'][activeCount] || String(activeCount);
  const accessLine = activeCount === 0
    ? 'No facility can see your record right now. A new appointment will ask you to share again.'
    : `${word} ${activeCount === 1 ? 'facility' : 'facilities'} can see parts of your record right now. You can stop sharing at any time.`;

  return (
    <div className="screen">
      <div className="mhead mhead--tight">
        <h1 className="mtitle">Your health wallet</h1>
        <p className="mlead mlead--muted">{givenFirst(WALLET_PATIENT.name)} · {WALLET_PATIENT.id}</p>
      </div>

      <div className="mpanel">
        <span className="mserif20">You decide who can see your record</span>
        <span>{accessLine}</span>
        <MButton variant="outline" className="mbtn--start mt8" onClick={() => w.setScreen('consent')}>Review who has access</MButton>
      </div>

      <MButton tall onClick={() => w.setScreen('bookTests')}><Ms glyph="event_available" />Book an appointment</MButton>

      <div className="mstack">
        <h2 className="mh2">Appointments in progress</h2>
        {w.active.map(r => (
          <button key={r.id} type="button" className="mcard" onClick={() => w.openAppointment(r)}>
            <StatusPill r={r} />
            <span className="strong">{r.test}</span>
            <span className="muted">{plain(r.status, r.lab, false, r).line}</span>
            {r.status === 'Reschedule proposed' && (
              <span className="countdown tabular"><Ms glyph="hourglass_top" size={20} />{r.respondCountdown}</span>
            )}
            <span className="mfine tabular">{r.updated}</span>
          </button>
        ))}
        {w.active.length === 0 && (
          <p className="mlead mlead--muted">Nothing in progress. Book an appointment when you need a test.</p>
        )}
      </div>

      <div className="mstack">
        <h2 className="mh2">Recent results</h2>
        <div className="mstack mstack--0">
          {w.documents.filter(d => !d.voided).slice(0, 2).map((d, i) => (
            <div key={i} className="mrow">
              <Ms glyph="description" className="forest" />
              <div className="mrow__text">
                <span className="strong">{d.name}</span>
                <span className="muted">{d.facility}</span>
                <span className="mfine tabular">{d.date}</span>
              </div>
            </div>
          ))}
        </div>
        <MButton variant="outline" className="mbtn--start" onClick={() => w.setScreen('docs')}>See all documents</MButton>
      </div>
    </div>
  );
}

/* ---------- P2 Detail ---------- */

export function Detail({ w, sel }: { w: Wallet; sel: Appointment }) {
  const p = plain(sel.status, sel.lab, false, sel);
  const summary = w.summaries[sel.id];
  const trail = [...sel.trail].reverse();
  return (
    <div className="screen">
      <MBack onClick={() => w.setScreen('home')}>Wallet home</MBack>
      <div className="mhead">
        <h1 className="mtitle">{sel.test}</h1>
        <StatusPill r={sel} />
        <p className="mlead">{p.line}</p>
      </div>

      <div className="mpanel mpanel--4">
        <span className="strong">{sel.lab}</span>
        <span className="muted">{sel.origin === 'Personal' ? 'You booked this yourself' : `Asked for by ${sel.fromFacility || w.rhu}`}</span>
        <span className="tabular">Your time: {sel.scheduledAt}</span>
      </div>

      {sel.status === 'Reschedule proposed' && (
        <div className="mnotice mnotice--amber">
          <span className="strong amber">{sel.lab} proposed a new time</span>
          <span className="tabular">{sel.proposedSlot}</span>
          <span className="tabular muted">{sel.respondCountdown}</span>
          <MButton variant="outline" className="mbtn--start" onClick={() => w.setScreen('proposed')}>See the proposed time</MButton>
        </div>
      )}

      {summary && <div className="mpanel mpanel--12"><SummaryBlock summary={summary} /></div>}

      {sel.result && ['Endorsed', 'Completed'].includes(sel.status) && <ResultPanel w={w} sel={sel} />}

      <div className="mstack mstack--16">
        <h2 className="mh2">What has happened</h2>
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
      </div>

      {['Sent', 'Received'].includes(sel.status) && (
        <div className="mpanel">You do not need to do anything. {sel.lab} will tell you when to come in.</div>
      )}
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
          <span className="strong">{sel.test} result</span>
          <span className="muted">{sel.lab}</span>
          <span className="mfine tabular">Released {sel.result!.released}</span>
        </div>
      </div>
      <MButton onClick={() => w.openResult(sel)}><Ms glyph="open_in_new" />Open result</MButton>
      {openedAt !== undefined && <span className="mfine tabular">You opened this result on {fmt(openedAt)}.</span>}
      <span className="mfine">
        {personal
          ? sel.status === 'Endorsed'
            ? 'You booked this yourself, so opening the result finishes the appointment. Ask a doctor what it means for you.'
            : 'Ask a doctor what this result means for you.'
          : sel.status === 'Endorsed'
            ? `${closer} ordered this test and will read the result. You do not need to do anything.`
            : 'Ask the provider who ordered it what this result means for you.'}
      </span>
    </div>
  );
}

/* ---------- P3 Documents ---------- */

export function Documents({ w }: { w: Wallet }) {
  return (
    <div className="screen">
      <h1 className="mtitle">Documents</h1>
      <p className="mlead mlead--muted">Results and prescriptions, newest first. VITAL does not explain what a result means — ask the provider who ordered it.</p>
      <div className="mstack mstack--0">
        {w.documents.map((d, i) => (
          <div key={i} className="mrow">
            <Ms glyph={d.voided ? 'report' : 'description'} className={d.voided ? 'clay' : ''} />
            <div className="mrow__text mrow__text--2">
              <span className={d.voided ? 'strong clay' : 'strong'}>{d.name}</span>
              <span className="muted">{d.facility}</span>
              <span className="mfine tabular">{d.date}</span>
              {d.voided && (
                <span className="clay">This document was withdrawn by the laboratory because it was attached to the wrong person. It is kept in your record so the correction is visible.</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- P4 Consent / P5 Revoke ---------- */

export function ConsentList({ w }: { w: Wallet }) {
  return (
    <div className="screen">
      <MHead title="Who can see your record">
        <p className="mlead">You decide who can see your record. Stopping a facility does not delete anything they have already read.</p>
      </MHead>
      <div className="mstack mstack--16">
        {w.consents.map(c => (
          <div key={c.key} className="mcard">
            <MBadge glyph={c.active ? 'shield' : 'shield_moon'} tone={c.active ? 'progress' : 'waiting'}>{c.active ? 'Sharing' : 'Ended'}</MBadge>
            <span className="strong">{c.facility}</span>
            <span>{c.scope}</span>
            <span className="mfine tabular">Granted {c.granted} · {c.until}</span>
            {c.active && (
              <MButton variant="danger-outline" className="mbtn--start mt8" onClick={() => w.startRevoke(c.key)}>Stop sharing</MButton>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

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

/* ---------- P9 Profile ---------- */

export function Profile() {
  return (
    <div className="screen">
      <MHead title="Your details">
        <p className="mlead">You entered these yourself. A facility sees them only while you are sharing your record with them.</p>
      </MHead>
      <div className="mstack mstack--0">
        {PROFILE.map(p => (
          <div key={p.label} className="mrow">
            <div className="mrow__text mrow__text--2">
              <span className="mfield-label">{p.label}</span>
              <span className="strong">{p.value}</span>
              <span className="mchip tabular mt4"><Ms glyph="edit_note" size={14} />You entered this · {p.updated}</span>
            </div>
            <MButton variant="quiet" className="mbtn--change">Change</MButton>
          </div>
        ))}
      </div>
      <div className="mpanel">VITAL does not read these details or decide anything from them. They are here because a facility often asks for them on paper.</div>
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
      <MBack onClick={() => w.setScreen('home')}>Wallet home</MBack>
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
            <span className="tabular muted">{sel.respondCountdown}</span>
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
