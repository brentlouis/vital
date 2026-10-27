import { useEffect } from 'react';
import { FileText, History, Lock } from 'lucide-react';
import { Card, Icon } from './ui';
import { useDemo } from '../store/context';
import { historyGrant } from '../domain/access';
import { PROFILE, WALLET_PATIENT, givenFirst } from '../domain/reference';
import { fmt, fmtDate } from '../domain/time';
import type { Appointment } from '../domain/view';
import type { Viewer } from '../domain/types';

/* The patient's earlier results and the details they entered themselves, for the facility
   on this appointment — only when the patient chose to share their history with it. This is
   a separate consent from the appointment's: without it the card says so and shows nothing.
   Every view is written to the audit log. */
export function PatientHistory({ sel, viewer }: { sel: Appointment; viewer: Viewer }) {
  const demo = useDemo();
  const { state, now } = demo;
  const facility = viewer.kind === 'staff' ? viewer.facility : '';
  const grant = historyGrant(state.historyGrants, state.appointments, sel.patientId, facility, now);

  useEffect(() => {
    /* The store keeps one entry per person, patient and minute, so re-renders add nothing. */
    if (grant) demo.recordHistoryView(viewer, sel.patientId);
  }, [grant, demo, viewer, sel.patientId]);

  const first = givenFirst(sel.patient).split(' ')[0];
  if (!grant) {
    return (
      <Card title="Patient history">
        <div className="history-locked">
          <Icon icon={Lock} size={16} />
          <span>Not shared with this facility. {first} can share their earlier results and details at the counter when referred, or from their health wallet.</span>
        </div>
      </Card>
    );
  }

  const earlier = state.appointments
    .filter(a => a.patientId === sel.patientId && a.id !== sel.id)
    .flatMap(a => a.results.filter(r => r.voidedAt === undefined && r.released <= now).map(r => ({ a, r })))
    .sort((x, y) => y.r.released - x.r.released);
  const details = sel.patientId === WALLET_PATIENT.id ? PROFILE : [];

  return (
    <Card title="Patient history">
      <p className="history-grant">
        <Icon icon={History} size={16} />
        <span>
          Shared by {first} {grant.by === 'Health wallet' ? 'from their wallet' : `at the counter, recorded by ${grant.by}`} on {fmtDate(grant.granted)}.
          {' '}{grant.appointmentId ? 'Ends when that appointment closes.' : 'Until they stop it.'}
        </span>
      </p>
      <div className="history-grid">
        <section>
          <h3 className="history-h">Details the patient entered</h3>
          {details.length ? (
            <dl className="facts">
              {details.map(d => (
                <div key={d.label} className="facts__row"><dt>{d.label}</dt><dd className={d.label === 'Allergies' ? 'strong clay' : undefined}>{d.value}</dd></div>
              ))}
            </dl>
          ) : <p className="muted small m0">None entered.</p>}
        </section>
        <section>
          <h3 className="history-h">Earlier results</h3>
          {earlier.length ? (
            <ul className="history-results">
              {earlier.map(({ a, r }) => (
                <li key={r.file}>
                  <Icon icon={FileText} size={16} />
                  <span className="history-results__text">
                    <span className="strong">{a.tests.join(', ')}</span>
                    <span className="muted small">{a.lab} · <span className="tabular">{fmt(r.released)}</span></span>
                  </span>
                </li>
              ))}
            </ul>
          ) : <p className="muted small m0">No earlier results.</p>}
        </section>
      </div>
      <p className="footnote m0">Viewing this is recorded in the audit log with your name.</p>
    </Card>
  );
}
