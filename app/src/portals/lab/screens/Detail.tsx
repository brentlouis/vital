import { Clock, FileText, Hospital, OctagonAlert, RotateCcw, ShieldCheck, ShieldOff, UserX } from 'lucide-react';
import { BackButton, Button, Callout, Card, Facts, Icon, OriginChip, StatusBadge } from '../../../components/ui';
import { ResultTile, StatusTrail } from '../../../components/StatusTrail';
import { RHU, givenFirst } from '../../../domain/reference';
import { resultMeta } from '../../../domain/status';
import { providerOf, type Appointment } from '../../../domain/view';
import type { Lab } from '../useLab';

/* L2 / L4 / L5 / L7 — appointment detail. Banners follow status and this facility's role on
   the appointment; the buttons are exactly what the flow table allows the signed-in person. */
export function Detail({ lab, sel }: { lab: Lab; sel: Appointment }) {
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

  return (
    <div className="detail">
      <BackButton onClick={() => lab.setScreen('queue')}>{queueTitle}</BackButton>

      <div className="detail__head">
        <h1 className="page-title">{sel.patient}</h1>
        <StatusBadge status={sel.status} />
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

      <div className="detail__grid">
        <div className="stack">
          <Card title="Request">
            <Facts rows={[
              ['Origin', <OriginChip key="origin" origin={sel.origin}>{originLong}</OriginChip>],
              ['Referring provider', providerOf(sel)],
              ['Scheduled', sel.scheduledAt, true],
              ['Test requested', withdrawn ? hidden : sel.test],
              ...(!withdrawn && sel.notSent?.length
                ? [['Not included', `${sel.notSent.join(', ')} — not offered at ${sel.lab}. Needs a separate appointment.`] as [string, string]]
                : []),
              ['Clinical note', withdrawn ? hidden : sel.note],
              ['Sent', sel.created, true],
            ]} />
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
                  : `${givenFirst(sel.patient)} granted this facility access to this appointment and its result. Access ends when the appointment closes.`}
              </span>
            </div>
          </div>

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
            </Card>
          )}
        </div>

        <div className="stack">
          {lab.readOnly && (
            <Callout tone="keylime" icon={ShieldCheck} title="Read-only access" className="callout--tight">
              <p>{lab.staff} can read appointments here but cannot update them. Switch user to record a status.</p>
            </Callout>
          )}
          {actions.length > 0 && (
            <section className="card actions">
              <h2 className="card__title actions__title">Update status</h2>
              {sel.status === 'Received' && actions.some(a => a.to === 'Accepted') && (
                <p className="actions__lead">This slot came from the times this facility publishes, so accepting confirms a time already offered. If it cannot be kept, propose another one rather than declining.</p>
              )}
              {actions.map(a => (
                <Button key={a.to} variant={a.ui.variant} size="lg" block icon={a.ui.icon} onClick={() => lab.run(sel, a)}>{a.ui.label}</Button>
              ))}
              <span className="actions__hint">{lab.staff} and this facility are written to the status trail with every update.</span>
            </section>
          )}

          <StatusTrail trail={sel.trail} />
        </div>
      </div>
    </div>
  );
}
