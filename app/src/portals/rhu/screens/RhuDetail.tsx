import { useState } from 'react';
import type { Minute } from '../../../domain/time';
import { DateTimeField } from '../../../components/DateTimeField';
import { CircleX, Clock, Hourglass, OctagonAlert, ShieldOff, UserX } from 'lucide-react';
import { BackButton, Button, Callout, Card, Facts, Icon, StatusBadge } from '../../../components/ui';
import { ResultTile, StatusTrail } from '../../../components/StatusTrail';
import { resultMeta } from '../../../domain/status';
import { providerOf, type Appointment } from '../../../domain/view';
import type { Rhu } from '../useRhu';
import { UndoRow } from '../../../components/UndoRow';
import { VisitOrders } from '../../../components/VisitOrders';
import { PatientHistory } from '../../../components/PatientHistory';

/* R3–R6 — appointment detail from the referring side. The flow table gives the health
   centre one step of its own: acknowledging a released result. Everything else is the
   laboratory's or the patient's. */
export function RhuDetail({ rhu, sel, embedded }: { rhu: Rhu; sel: Appointment; embedded?: boolean }) {
  if (sel.visit) return <VisitDetail rhu={rhu} sel={sel} embedded={embedded} />;
  const H = embedded ? 'h2' : 'h1';
  const undo = rhu.undoFor(sel);
  const awaiting = ['Sent', 'Received', 'Accepted', 'Overdue', 'Reschedule proposed', 'Patient arrived'].includes(sel.status);

  return (
    <div className={embedded ? 'detail detail--embedded' : 'detail'}>
      {!embedded && <BackButton onClick={() => rhu.setScreen('queue')}>Appointment queue</BackButton>}
      <div className="detail__head">
        <H className="page-title" data-focus-target="">{sel.patient}</H>
        <StatusBadge status={sel.status} />
        <span className="muted tabular">{sel.id}</span>
      </div>
      <p className="page-sub">{sel.id} · {sel.age} · {sel.sex} · {sel.municipality} · patient ID {sel.patientId} · created {sel.created}</p>

      {rhu.error && (
        <Callout tone="clay" icon={OctagonAlert} title="That update was not recorded" className="callout--tight">
          <p>{rhu.error}</p>
        </Callout>
      )}

      {sel.status === 'Overdue' && (
        <Callout tone="amber" icon={Clock} title={`Expected by ${sel.expectedBy}. The patient has not arrived.`}>
          <p>{sel.lab} is still holding the slot. If you can reach the patient, follow up with them. If they are not coming, {sel.lab} records the no-show — it holds the slot, so it is the one to close it — and you are told when it does.</p>
        </Callout>
      )}

      {sel.status === 'No-show' && (
        <Callout tone="amber" icon={UserX} title={`${sel.lab} recorded that the patient did not arrive`}>
          <p>The {sel.scheduledAt} slot passed with no arrival. This appointment is closed. If the patient still needs the test, create a new appointment.</p>
          <span className="callout__meta tabular">{sel.trail[sel.trail.length - 1].actor} · {sel.lab} · {sel.updated}</span>
        </Callout>
      )}

      {sel.status === 'Reschedule proposed' && (
        <Callout tone="amber" icon={Hourglass} title={`${sel.lab} proposed a new time`}>
          <p>You have been told because you referred this patient. Only the patient can accept a new time — they are the one travelling. Nothing is required of this health centre.</p>
          <Facts inset rows={[
            ['Original slot', sel.scheduledAt, true],
            ['Proposed slot', sel.proposedSlot, true],
            ['Patient response', sel.respondCountdown, true],
          ]} />
          <p>If the patient does not answer within 48 hours the appointment returns to the facility as declined, with the reason "No response to proposed time."</p>
        </Callout>
      )}

      {sel.status === 'Declined' && (
        <Callout tone="clay" icon={CircleX} title={`Declined by ${sel.lab}`}>
          <p>{sel.declineReason}</p>
          <span className="callout__meta tabular">{sel.labStaff} · {sel.lab} · {sel.updated}</span>
          <p>This appointment is closed. Create a new appointment to send the patient to another laboratory.</p>
        </Callout>
      )}

      {sel.status === 'Consent revoked' && (
        <Callout tone="amber" icon={ShieldOff} title="The patient revoked access to this record">
          <p>The clinical content has been withdrawn. The appointment and its status trail remain for the audit log. This appointment is closed.</p>
        </Callout>
      )}

      <div className="detail__grid">
        <div className="stack">
          <Card title="Appointment" className="card--request">
            <Facts rows={[
              ['Receiving facility', sel.lab],
              ['Test requested', sel.test],
              ...(sel.notSent?.length
                ? [['Not included', `${sel.notSent.join(', ')} — not offered at ${sel.lab}. Needs a separate appointment.`] as [string, string]]
                : []),
              ['Scheduled', sel.scheduledAt, true],
              ['Referring provider', providerOf(sel)],
              ['Clinical note', sel.note],
            ]} />
          </Card>

          {sel.result && (
            <Card title="Result">
              <ResultTile file={sel.result.file} meta={resultMeta(sel.result)} />
              {rhu.actionsFor(sel).map(a => (
                <div key={a.to} className="ack">
                  <Button size="md" icon={a.ui.icon} onClick={() => rhu.run(sel, a)}>{a.ui.label}</Button>
                  <span className="muted small">Acknowledging records that this health centre has read the result. The appointment then closes as completed.</span>
                </div>
              ))}
              {undo && (
            <UndoRow status={undo.status} at={undo.at} onUndo={() => rhu.takeBack(sel)} />
          )}
            </Card>
          )}

          {awaiting && (
            <div className="card consent">
              <span className="consent__icon muted"><Icon icon={Hourglass} /></span>
              <div className="consent__body">
                <span className="consent__title consent__title--plain">No result yet</span>
                <span className="muted">{sel.lab} has not released a result for this appointment yet. You do not need to do anything until it arrives.</span>
              </div>
            </div>
          )}
        </div>

        <StatusTrail trail={sel.trail} footnote="Every entry names the person who wrote it. Entries cannot be edited or removed." />
      </div>
    </div>
  );
}

/* A doctor visit a patient booked with this health centre. The health centre is the one
   receiving it: it confirms the time, records the arrival and that the doctor saw the
   patient, and orders any tests from the visit. */
function VisitDetail({ rhu, sel, embedded }: { rhu: Rhu; sel: Appointment; embedded?: boolean }) {
  const H = embedded ? 'h2' : 'h1';
  const undo = rhu.undoFor(sel);
  const actions = rhu.actionsFor(sel);
  return (
    <div className={embedded ? 'detail detail--embedded' : 'detail'}>
      {!embedded && <BackButton onClick={() => rhu.setScreen('queue')}>Appointment queue</BackButton>}
      <div className="detail__head">
        <H className="page-title" data-focus-target="">{sel.patient}</H>
        <StatusBadge status={sel.status} />
        <span className="muted tabular">{sel.id}</span>
      </div>
      <p className="page-sub">Doctor visit · {sel.age} · {sel.sex} · {sel.municipality} · patient ID {sel.patientId}</p>

      {rhu.error && (
        <Callout tone="clay" icon={OctagonAlert} title="That update was not recorded" className="callout--tight">
          <p>{rhu.error}</p>
        </Callout>
      )}
      {sel.status === 'Overdue' && (
        <Callout tone="amber" icon={Clock} title={`Expected at ${sel.scheduledAt}. The patient has not arrived.`}>
          <p>If the patient is here, mark them arrived. If they are not coming, record that they did not arrive.</p>
        </Callout>
      )}

      <div className="detail__grid">
        <div className="stack">
          <Card title="Visit" className="card--request">
            <Facts rows={[
              ['Booked by', 'The patient, from the health wallet'],
              ['Scheduled', sel.scheduledAt, true],
              ['Reason given', sel.note],
              ['Booked', sel.created, true],
            ]} />
          </Card>
          <PatientHistory sel={sel} viewer={rhu.viewer} />
          <VisitOrders visit={sel} ordered={rhu.orderedFrom(sel)} canOrder={!rhu.viewer.readOnly}
            onOrder={() => rhu.orderFromVisit(sel)} onOpen={rhu.openDetail} />
          {(actions.length > 0 || undo) && (
            <section className="card actions">
              <h2 className="card__title actions__title">Update status</h2>
              {rhu.proposeFor === sel.id && <ProposeTime rhu={rhu} sel={sel} />}
              {actions.map(a => (
                <Button key={a.to} variant={a.ui.variant} size="lg" block icon={a.ui.icon} onClick={() => rhu.run(sel, a)}>{a.ui.label}</Button>
              ))}
              {actions.length > 0 && <span className="actions__hint">{rhu.viewer.name} and this health centre are written to the status trail with every update.</span>}
              {undo && <UndoRow status={undo.status} at={undo.at} visit onUndo={() => rhu.takeBack(sel)} />}
            </section>
          )}
        </div>
        <div className="stack">
          <StatusTrail trail={sel.trail} footnote="Every entry names the person who wrote it. Entries cannot be edited or removed." />
        </div>
      </div>
    </div>
  );
}

/* Proposing a new time for a visit: the health centre's own published times, by day. */
function ProposeTime({ rhu, sel }: { rhu: Rhu; sel: Appointment }) {
  const [slot, setSlot] = useState<Minute | null>(null);
  return (
    <div className="propose-inline">
      <span className="strong">Choose the new time</span>
      <DateTimeField id="visit-propose" now={rhu.now} value={slot} onChange={setSlot} exclude={sel.slot} />
      <span className="actions__hint">Only the patient can accept it. If they do not answer within 48 hours, the visit comes back here to decline.</span>
      <div className="choice-row">
        <Button size="md" disabled={slot === null} onClick={() => slot !== null && rhu.proposeTime(sel, slot)}>Propose this time</Button>
        <Button size="md" variant="outline" onClick={() => rhu.setProposeFor(null)}>Cancel</Button>
      </div>
    </div>
  );
}

