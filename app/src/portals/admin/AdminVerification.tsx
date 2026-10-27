import { useEffect, useState } from 'react';
import { Check, CheckCheck, CircleX, Clock, FileText, type LucideIcon } from 'lucide-react';
import { PortalNav } from '../../components/PortalNav';
import { BadgeCheck, BarChart3, MessageSquareWarning, ScrollText } from 'lucide-react';
import { AuditLog, PilotMeasures, ReportedIssues } from './AdminScreens';
import { BackButton, Button, Card, Facts, Icon, Pills } from '../../components/ui';
import { PrototypeBar, PrototypeLabel, SessionBar } from '../../components/PortalChrome';
import { useDemo } from '../../store/context';
import { fmt } from '../../domain/time';
import { useScreenFocus } from '../../components/useScreenFocus';

type Screen = 'queue' | 'review' | 'measures' | 'audit' | 'issues';
const SCREENS: { id: Screen; label: string }[] = [
  { id: 'queue', label: 'A1 Verification queue' },
  { id: 'review', label: 'A2 Facility review' },
  { id: 'measures', label: 'A3 Pilot measures' },
  { id: 'audit', label: 'A4 Audit log' },
  { id: 'issues', label: 'A5 Reported issues' },
];

type Decision = 'Pending' | 'Approved' | 'Rejected';
const STATUS: Record<Decision, { icon: LucideIcon; tone: string; accent: 'amber' | 'none' | 'clay' }> = {
  Pending: { icon: Clock, tone: 'attention', accent: 'amber' },
  Approved: { icon: CheckCheck, tone: 'done', accent: 'none' },
  Rejected: { icon: CircleX, tone: 'fail', accent: 'clay' },
};

const REASONS = [
  'The licence number does not match the permit uploaded.',
  'A document is unreadable or incomplete.',
  'The permit has expired.',
  'This facility is already registered under another account.',
];

const ADMIN = 'A. Lumayag';

function DecisionBadge({ status, label }: { status: Decision; label?: string }) {
  const m = STATUS[status];
  return <span className={`badge badge--${m.tone}`}><Icon icon={m.icon} size={14} />{label ?? status}</span>;
}

/* A1–A2 — the platform administrator's facility verification queue. */
export function AdminVerification() {
  const [screen, setScreen] = useState<Screen>('queue');
  /* Registrations live in the shared store: one submitted from facility onboarding (F2)
     appears here, and a decision here shows on that facility's pending screen (F3). */
  const { state, now, decideRegistration } = useDemo();
  const facilities = [...state.registrations].sort((a, b) => b.submitted - a.submitted);
  const [selectedRef, setSelectedRef] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState<number | null>(null);
  const [note, setNote] = useState('');

  useEffect(() => { document.title = 'VITAL — Admin verification'; }, []);
  useScreenFocus([screen, selectedRef]);

  const open = (ref: string) => { setSelectedRef(ref); setRejecting(false); setReason(null); setNote(''); setScreen('review'); };
  const f = facilities.find(r => r.reference === selectedRef) ?? facilities[0];
  const decide = (status: 'Approved' | 'Rejected', why: string | null) =>
    decideRegistration(f.reference, status, why);

  const waiting = facilities.filter(x => x.status === 'Pending').length;

  return (
    <div className="portal" data-density="compact">
      <SessionBar name={ADMIN} line="VITAL administrator · Platform" shared={false} />
      <PrototypeBar>
        <PrototypeLabel>Prototype screens</PrototypeLabel>
        <Pills items={SCREENS} value={screen} onChange={setScreen} />
      </PrototypeBar>

      <div className="portal__body">
      <PortalNav<'queue' | 'measures' | 'audit' | 'issues'> label="Administration"
        value={screen === 'review' ? 'queue' : screen} onChange={setScreen} items={[
          { id: 'queue', label: 'Verification', icon: BadgeCheck, count: waiting },
          { id: 'measures', label: 'Pilot measures', icon: BarChart3 },
          { id: 'audit', label: 'Audit log', icon: ScrollText },
          { id: 'issues', label: 'Reported issues', icon: MessageSquareWarning, count: state.issues.filter(i => i.status === 'Open').length },
        ]} />
      <main className="portal__main">
        {screen === 'measures' && <PilotMeasures />}
        {screen === 'audit' && <AuditLog />}
        {screen === 'issues' && <ReportedIssues />}
        {screen === 'queue' && (
          <div>
            <div className="page-head">
              <h1 className="page-title">Verification queue</h1>
              <span className="muted tabular">{waiting} waiting</span>
              <span className="page-head__end">Updated {fmt(now)}</span>
            </div>
            <div className="table-card">
              <table className="queue">
                <colgroup>
                  <col style={{ width: '26%' }} /><col style={{ width: 150 }} /><col style={{ width: 140 }} />
                  <col style={{ width: 200 }} /><col style={{ width: 150 }} /><col style={{ width: 140 }} />
                </colgroup>
                <thead>
                  <tr>
                    <th scope="col">Facility name</th><th scope="col">Type</th><th scope="col">Municipality</th>
                    <th scope="col">Licence number</th><th scope="col" className="num">Submitted</th><th scope="col" className="num">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {facilities.map(r => {
                    return (
                      <tr key={r.reference} onClick={() => open(r.reference)}
                        className={`queue__row accent--${STATUS[r.status].accent}`}>
                        <td className="queue__patient">
                          <button type="button" className="row-link" onClick={e => { e.stopPropagation(); open(r.reference); }}>{r.name}</button>
                        </td>
                        <td>{r.type}</td>
                        <td>{r.municipality}</td>
                        <td className="tabular">{r.licence}</td>
                        <td className="num muted tabular nowrap">{fmt(r.submitted)}</td>
                        <td className="num queue__action">
                          {r.status === 'Pending'
                            ? <Button onClick={e => { e.stopPropagation(); open(r.reference); }}>Review</Button>
                            : <DecisionBadge status={r.status} />}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {facilities.length === 0 && (
                <div className="empty">
                  <span className="empty__title">No facilities waiting for verification.</span>
                  <span className="empty__body">New registrations appear here as they are submitted.</span>
                </div>
              )}
            </div>
            <p className="footnote">An unverified facility cannot receive appointments, does not appear in patient facility search, and holds no consent grants.</p>
          </div>
        )}

        {screen === 'review' && f && (
          <div className="narrow-1000">
            <BackButton onClick={() => setScreen('queue')}>Verification queue</BackButton>
            <div className="detail__head">
              <h1 className="page-title">{f.name}</h1>
              <DecisionBadge status={f.status} label={f.status === 'Pending' ? 'Pending verification' : f.status} />
            </div>
            <p className="page-sub">{f.reference} · submitted {fmt(f.submitted)}</p>

            <div className="detail__grid">
              <div className="stack">
                <Card title="Registration">
                  <Facts wide rows={[
                    ['Facility type', f.type],
                    ['Municipality', f.municipality],
                    ['Address', f.address],
                    ['Licence number', f.licence, true],
                    ['Admin contact', f.admin],
                    ['Email', f.email],
                    ['Mobile', f.mobile, true],
                  ]} />
                </Card>
                <Card title="Submitted documents">
                  <div className="stack-8">
                    {f.documents.map(d => (
                      <div key={d.file} className="tile">
                        <span className="tile__icon"><Icon icon={FileText} /></span>
                        <div className="tile__text">
                          <span className="tile__name">{d.title}</span>
                          <span className="tile__meta">{d.file} · {d.size} · uploaded {fmt(d.uploaded)}</span>
                        </div>
                        <a href="#" className="tile__end small" onClick={e => e.preventDefault()}>Open document</a>
                      </div>
                    ))}
                  </div>
                  <p className="footnote">Check the licence number on the permit against the number entered at registration before approving.</p>
                </Card>
              </div>

              <div className="stack">
                {f.status === 'Pending' && !rejecting && (
                  <section className="card actions">
                    <h2 className="card__title actions__title">Decision</h2>
                    <Button size="lg" block icon={Check} onClick={() => decide('Approved', null)}>Approve facility</Button>
                    <Button size="lg" block variant="danger-outline" icon={CircleX} onClick={() => setRejecting(true)}>Reject registration</Button>
                    <span className="actions__hint">Approving emails an activation link to {f.email}. Your name is recorded against the decision.</span>
                  </section>
                )}

                {f.status === 'Pending' && rejecting && (
                  <div className="reject">
                    <span className="bold clay">Why is this registration rejected?</span>
                    <span className="small">The reason is sent to {f.email} so the facility knows what to correct. A rejection without a reason is not permitted.</span>
                    <fieldset className="reject__reasons">
                      <legend className="sr-only">Rejection reason</legend>
                      {REASONS.map((label, i) => (
                        <label key={label} className="reject__reason">
                          <input type="radio" name="reject-reason" checked={reason === i} onChange={() => setReason(i)} />
                          <span>{label}</span>
                        </label>
                      ))}
                    </fieldset>
                    <label className="field-sm">
                      <span className="muted">Note to the facility (optional)</span>
                      <textarea rows={3} className="input input--area small" value={note} onChange={e => setNote(e.target.value)} />
                    </label>
                    <div className="inline-actions inline-actions--8">
                      <Button size="md" variant="danger" disabled={reason === null}
                        onClick={() => {
                          if (reason === null) return;
                          decide('Rejected', REASONS[reason] + (note.trim() ? ' ' + note.trim() : ''));
                          setRejecting(false); setReason(null); setNote('');
                        }}>Reject registration</Button>
                      <Button size="md" variant="ghost" onClick={() => { setRejecting(false); setReason(null); setNote(''); }}>Keep it pending</Button>
                    </div>
                    <span className="xs clay">{reason === null ? 'Choose a reason. A rejection cannot be sent without one.' : 'The facility is told immediately and can submit again.'}</span>
                  </div>
                )}

                {f.status !== 'Pending' && (
                  <section className="card stack-8">
                    <h2 className="card__title m0">Decision recorded</h2>
                    <span className="small">
                      {f.status === 'Approved'
                        ? `Approved by ${ADMIN} on ${fmt(f.decidedAt ?? now)}. An activation link was emailed to ${f.email}. The facility becomes able to receive appointments once the admin sets a password.`
                        : `Rejected by ${ADMIN} on ${fmt(f.decidedAt ?? now)}. The reason below was emailed to ${f.email}. The facility can correct its documents and submit again.`}
                    </span>
                    {f.reason && <span className="small reject__recorded">{f.reason}</span>}
                  </section>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
      </div>
    </div>
  );
}
