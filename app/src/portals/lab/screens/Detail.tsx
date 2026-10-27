import { Clock, FileText, Sparkles, Hospital, OctagonAlert, RotateCcw, ShieldCheck, ShieldOff, UserX } from 'lucide-react';
import { BackButton, Button, Callout, Card, Facts, Icon, OriginChip, StatusBadge } from '../../../components/ui';
import { ResultTile, StatusTrail } from '../../../components/StatusTrail';
import { RHU, givenFirst } from '../../../domain/reference';
import { resultMeta } from '../../../domain/status';
import { providerOf, type Appointment } from '../../../domain/view';
import type { Estimate } from '../../../domain/estimate';
import { dayIndex, fmtDay, fmtTime } from '../../../domain/time';
import type { Lab } from '../useLab';
import { UndoRow } from '../../../components/UndoRow';
import { VisitOrders } from '../../../components/VisitOrders';
import { PatientHistory } from '../../../components/PatientHistory';

/* L2 / L4 / L5 / L7 — appointment detail. Banners follow status and this facility's role on
   the appointment; the buttons are exactly what the flow table allows the signed-in person. */
export function Detail({ lab, sel, embedded }: { lab: Lab; sel: Appointment; embedded?: boolean }) {
  const H = embedded ? 'h2' : 'h1';
  const { signedIn, merged } = lab;
  const internal = sel.origin === 'Internal';
  const outgoing = sel.fromFacility === signedIn && sel.lab !== signedIn;
  const withdrawn = lab.access(sel) === 'withdrawn';
  const last = sel.trail[sel.trail.length - 1];
  const queueTitle = merged ? 'Appointment queue' : 'Incoming queue';
  const actions = lab.actionsFor(sel);
  const orderer = sel.origin === 'Personal' ? null : sel.fromFacility;
  const hidden = 'Withdrawn at the patient’s request.';
  const expired = sel.respondMinsLeft !== null && sel.respondMinsLeft <= 0;

  const originLong = sel.origin === 'Personal'
    ? 'Personal — booked by the patient'
    : internal ? 'Internal — ordered by this facility'
      : (sel.fromFacility === RHU ? 'Referred — booked by a health centre' : 'Referred — booked by a partner facility');

  /* What can be done now, at the bottom of the reading column: staff read the request, consent
     and result first, then act. Steps about the result itself (acknowledge, void) sit in the
     Result card, under the document they concern; everything else is in Update status. The
     status trail keeps the right-hand column to itself. */
  const undoable = lab.undoFor(sel);
  const aboutResult = (to: string) => to === 'Completed' || to === 'Result voided';
  const resultActions = sel.result ? actions.filter(a => aboutResult(a.to)) : [];
  /* A time VITAL picked is never reset by hand on arrival: staff accept it, or VITAL picks again. */
  const repickable = sel.autoTime && sel.status === 'Received' && actions.some(a => a.to === 'Accepted');
  const statusActions = actions.filter(a => !resultActions.includes(a) && !(repickable && a.to === 'Reschedule proposed'));
  const resultUndo = undoable && sel.result && aboutResult(undoable.status) ? undoable : null;
  const undo = resultUndo ? null : undoable;
  const act = (
    <>
      {(statusActions.length > 0 || undo) && (
        <section className="card actions">
          <h2 className="card__title actions__title">Update status</h2>
          {sel.status === 'Received' && statusActions.some(a => a.to === 'Accepted') && (
            <p className="actions__lead">{repickable
              ? 'VITAL picked this time for the patient. Accept it if it fits; if not, VITAL picks another and the patient is told.'
              : 'Check this time against your schedule. Accept it if it fits; if not, propose another time rather than declining. The patient decides.'}</p>
          )}
          {statusActions.map(a => (
            <Button key={a.to} variant={a.ui.variant} size="lg" block icon={a.ui.icon} onClick={() => lab.run(sel, a)}>{a.ui.label}</Button>
          )).flatMap((b, i) => (repickable && i === 0 ? [b, <Button key="repick" variant="outline" size="lg" block icon={Sparkles} onClick={() => lab.repick(sel)}>Re-pick automatically</Button>] : [b]))}
          {statusActions.length > 0 && <span className="actions__hint">{lab.staff} and this facility are written to the status trail with every update.</span>}
          {undo && (
            <UndoRow status={undo.status} at={undo.at} visit={sel.visit} onUndo={() => lab.takeBack(sel)} />
          )}
        </section>
      )}
    </>
  );

  return (
    <div className={embedded ? 'detail detail--embedded' : 'detail'}>
      {!embedded && <BackButton onClick={() => lab.setScreen('queue')}>{queueTitle}</BackButton>}

      <div className="detail__head">
        <H className="page-title" data-focus-target="">{sel.patient}</H>
        <StatusBadge status={sel.status} />
        {sel.priority && <span className="priority-chip">Priority</span>}
        <span className="muted tabular">{sel.id}</span>
      </div>
      <p className="page-sub">
        {withdrawn
          ? `${sel.id} · patient details withdrawn`
          : `${sel.id} · ${sel.age} · ${sel.sex} · ${sel.municipality} · patient ID ${sel.patientId}`}
      </p>

      {lab.error && (
        <Callout tone="clay" icon={OctagonAlert} title="That update was not recorded" className="callout--tight">
          <p>{lab.error}</p>
        </Callout>
      )}

      {sel.status === 'No-show' && (
        <Callout tone="amber" icon={UserX} title="The patient did not arrive for this slot">
          <p>The slot passed with no arrival recorded. This appointment is closed and no result can be attached. {orderer && orderer !== signedIn ? `${orderer} and the patient were told.` : 'The patient was told.'} If the patient still needs the test, {orderer ? 'a new appointment is booked' : 'they book a new appointment'}.</p>
          <Facts inset rows={[
            ['Missed slot', sel.scheduledAt, true],
            ['Recorded by', `${last.actor} · ${last.facility}`],
            ['Recorded at', last.at, true],
          ]} />
        </Callout>
      )}

      {sel.status === 'Overdue' && !outgoing && (
        <Callout tone="amber" icon={Clock} title={`The patient has not arrived for the ${sel.scheduledAt} slot`}>
          <p>The slot passed more than an hour ago with no arrival recorded. If the patient is here, mark them arrived. If they are not coming, record that the patient did not arrive — this facility holds the slot, so it is the one to close it.</p>
        </Callout>
      )}

      {internal && (
        <Callout tone="keylime" icon={Hospital} title="Internal order — ordered and performed by this facility" className="callout--tight">
          <p>{sel.trail[0]?.actor} ordered this from {sel.lab}'s own laboratory. There is no handoff: it was accepted into a time this facility publishes when it was placed, and this facility acknowledges the result. Internal orders are not counted in the referral turnaround measure.</p>
        </Callout>
      )}

      {outgoing && (
        <Callout tone="keylime" icon={FileText} title="Referred out by this facility" className="callout--tight">
          <p>This facility referred this appointment to {sel.lab}. {sel.lab} performs the test and releases the result; nothing here can be marked on their behalf.</p>
        </Callout>
      )}

      {sel.status === 'Reschedule proposed' && (
        <Callout tone="amber" icon={RotateCcw} title={expired ? 'The patient did not answer the proposed time' : 'A new time has been proposed to the patient'}>
          <p>
            {expired
              ? 'The 48-hour window has passed with no answer, so the appointment is back with this facility. Decline it with the reason "No response to proposed time."'
              : 'This appointment is waiting on the patient, not on you. Only the patient can accept a new time — they are the one travelling. The referring facility has been told.'}
          </p>
          <Facts inset rows={[
            ['Original slot', sel.scheduledAt, true],
            ['Proposed slot', sel.proposedSlot, true],
            ['Response window', sel.respondCountdown, true],
          ]} />
        </Callout>
      )}

      {sel.priorVoid && (
        <Callout tone="amber" icon={RotateCcw} title="Previously voided — re-uploaded" className="callout--tight">
          <p>The earlier result for this appointment was {sel.priorVoid.reason} and was voided on {sel.priorVoid.at} by {sel.priorVoid.by}. The voided document stays in the record and remains readable to the audit log. The document below replaces it.</p>
        </Callout>
      )}

      {withdrawn && (
        <Callout tone="amber" icon={ShieldOff} title="The patient revoked this facility's access">
          <p>The clinical content and the test request have been withdrawn. The appointment and its status trail stay visible so the record of what this laboratory was asked to do is not lost. This appointment is closed and no result can be attached.</p>
          <p className="inset">Open decision: whether a revoked appointment stays visible in this form or disappears from the receiving facility entirely is a legal question, recorded in DECISIONS.md and not settled. This screen draws the first answer without committing to it.</p>
        </Callout>
      )}

      {lab.readOnly && (
        <Callout tone="keylime" icon={ShieldCheck} title="Read-only access" className="callout--tight">
          <p>{lab.staff} can read appointments here but cannot update them. Switch user to record a status.</p>
        </Callout>
      )}

      <div className="detail__grid">
        <div className="stack">
          <Card title="Request" className="card--request">
            <Facts rows={[
              ['Origin', <OriginChip key="origin" origin={sel.origin}>{originLong}</OriginChip>],
              ['Referring provider', providerOf(sel)],
              ['Scheduled', sel.scheduledAt, true],
              ['Priority', sel.priority ? <span key="p" className="priority-text">{sel.priority} — set by the referring facility</span> : 'None'],
              ['Test requested', withdrawn ? hidden : sel.test],
              ...(!withdrawn && sel.notSent?.length
                ? [['Not included', `${sel.notSent.join(', ')} — not offered at ${sel.lab}. Needs a separate appointment.`] as [string, string]]
                : []),
              ['Clinical note', withdrawn ? hidden : sel.note],
              ['Sent', sel.created, true],
            ]} />
            {!outgoing && !withdrawn && (() => { const e = lab.estimate(sel); return e ? <EstimateLine e={e} now={lab.now} /> : null; })()}
            {sel.referredBy && !withdrawn && (
              <div className="referred-by">
                <span className="referred-by__label">Referred by (patient's note)</span>
                <span className="referred-by__name">{sel.referredBy}</span>
                <span className="referred-by__label">For your reference only. This person is not recorded in the status trail and has no access to the result.</span>
              </div>
            )}
          </Card>

          <div className={`card consent consent--${withdrawn ? 'amber' : 'forest'}`}>
            <span className="consent__icon"><Icon icon={withdrawn ? ShieldOff : ShieldCheck} /></span>
            <div className="consent__body">
              <span className="consent__title">{withdrawn ? 'No active consent' : 'Consent active'}</span>
              <span>
                {withdrawn
                  ? 'This facility can no longer read the clinical content of this appointment.'
                  : sel.trail[0]?.note?.includes('agreed at the counter')
                    ? `${sel.trail[0].note} Access covers this appointment and its result, and ends when the appointment closes.`
                    : `${givenFirst(sel.patient)} granted this facility access to this appointment and its result. Access ends when the appointment closes.`}
              </span>
            </div>
          </div>

          {!withdrawn && <PatientHistory sel={sel} viewer={lab.viewer} />}

          {sel.visit && (
            <VisitOrders visit={sel} ordered={[...lab.incoming, ...lab.outgoing].filter(r => r.fromVisit === sel.id)}
              canOrder={lab.caps.canRefer && !lab.readOnly && sel.lab === signedIn}
              onOrder={() => lab.orderFromVisit(sel)} onOpen={lab.openDetail} />
          )}

          {sel.result && !withdrawn && (
            <Card title="Result">
              <ResultTile file={sel.result.file}
                meta={sel.voided ? 'Voided document retained for the audit log' : resultMeta(sel.result)} />
              {sel.voided && (
                <div className="void-note">
                  <span className="void-note__icon"><Icon icon={OctagonAlert} /></span>
                  <span>This document is voided and stays in the record. Upload the correct result; the voided document remains readable to the audit log and is never deleted.</span>
                </div>
              )}
              {resultActions.length > 0 && (
                <div className="result-actions">
                  {resultActions.map(a => (
                    <Button key={a.to} variant={a.ui.variant} size="md" icon={a.ui.icon} onClick={() => lab.run(sel, a)}>{a.ui.label}</Button>
                  ))}
                  {resultActions.some(a => a.to === 'Completed') && (
                    <span className="actions__hint">Acknowledging records that this facility has read the result. The appointment then closes as completed.</span>
                  )}
                </div>
              )}
              {resultUndo && <UndoRow status={resultUndo.status} at={resultUndo.at} onUndo={() => lab.takeBack(sel)} />}
            </Card>
          )}
          {act}
        </div>

        <div className="stack">
          <StatusTrail trail={sel.trail} />
        </div>
      </div>
    </div>
  );
}

/* Wait and result timing for staff, learned from past timestamps. */
function EstimateLine({ e, now }: { e: Estimate; now: number }) {
  const r = e.result;
  const when = r && `${dayIndex(r.from) === dayIndex(now) ? 'today' : fmtDay(r.from)}, ${fmtTime(r.from)}–${dayIndex(r.to) === dayIndex(r.from) ? fmtTime(r.to) : `${fmtDay(r.to)} ${fmtTime(r.to)}`}`;
  return (
    <div className="estimate">
      {e.wait && <div className="estimate__row"><span className="estimate__label">Queue now</span><span className="tabular">{e.wait.ahead} waiting · about {e.wait.minutes} min</span></div>}
      {r && <div className="estimate__row"><span className="estimate__label">Result expected</span><span className="tabular">{when}</span></div>}
      <span className="estimate__basis">{e.basis} Shown to the patient as a range.</span>
    </div>
  );
}
