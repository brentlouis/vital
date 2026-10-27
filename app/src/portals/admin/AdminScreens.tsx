import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Button, Card, Chip, Icon, Tabs } from '../../components/ui';
import { useDemo } from '../../store/context';
import { auditRows, pilotMeasures } from '../../domain/measures';
import { person } from '../../domain/reference';
import { fmt } from '../../domain/time';

/* The VITAL team's side of the pilot: what it measures (objectives 4–7), every logged
   action (functions 2 and 11), and the problems facilities report (function 11). */

const hours = (h: number | null) => (h === null ? '—' : h >= 48 ? `${(h / 24).toFixed(1)} days` : `${Math.round(h)} h`);

/* ---------- Pilot measures ---------- */

export function PilotMeasures() {
  const { state, now } = useDemo();
  const m = pilotMeasures(state, now);
  const target = 30;
  const met = m.reduction !== null && m.reduction >= target;
  return (
    <div className="stack">
      <div className="page-head">
        <h1 className="page-title">Pilot measures</h1>
        <span className="muted">Bohol pilot · from the records, never typed in</span>
      </div>

      <div className="stats">
        <div className="stat stat--lead">
          <span className="stat__label">Referral to result, median</span>
          <span className="stat__value tabular">{hours(m.medianHours)}</span>
          <span className="stat__note">Manual baseline {hours(m.baselineHours)} · {m.reduction === null ? 'no results yet' : `${m.reduction}% faster`}</span>
          <span className={met ? 'stat__goal stat__goal--met' : 'stat__goal'}>Goal: at least {target}% faster than the site's own baseline{met ? ' — met' : ''}</span>
        </div>
        <div className="stat">
          <span className="stat__label">Referrals sent</span>
          <span className="stat__value tabular">{m.referrals}</span>
          <span className="stat__note">{m.completed} completed, loop closed by the referrer</span>
        </div>
        <div className="stat">
          <span className="stat__label">Arrival confirmed</span>
          <span className="stat__value tabular">{m.arrivalsConfirmed} of {m.arrivalsDue}</span>
          <span className="stat__note">Referrals whose time has passed</span>
        </div>
        <div className="stat">
          <span className="stat__label">Results delivered digitally</span>
          <span className="stat__value tabular">{m.resultsDelivered}</span>
          <span className="stat__note">No paper copy needed</span>
        </div>
        <div className="stat">
          <span className="stat__label">Patients in the Health Wallet</span>
          <span className="stat__value tabular">{m.patients}</span>
          <span className="stat__note">Target 50–100 · {m.visits} doctor visits booked</span>
        </div>
        <div className="stat">
          <span className="stat__label">Provider feedback</span>
          <span className="stat__value tabular">{m.issuesTotal}</span>
          <span className="stat__note">Reports from facilities · {m.issuesOpen} open</span>
        </div>
      </div>

      <Card title="By laboratory">
        <div className="table-scroll">
          <table className="queue">
            <thead><tr><th scope="col">Laboratory</th><th scope="col" className="num">Referrals</th><th scope="col" className="num">Results delivered</th><th scope="col" className="num">Referral to result, median</th></tr></thead>
            <tbody>
              {m.sites.map(s => (
                <tr key={s.lab}><td>{s.lab}</td><td className="num tabular">{s.referrals}</td><td className="num tabular">{s.results}</td><td className="num tabular">{hours(s.medianHours)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="footnote">Synthetic records. The baseline is a sample until each pilot site records its own before measuring; only referred laboratory appointments count, not doctor visits or internal orders.</p>
    </div>
  );
}

/* ---------- Audit log ---------- */

type AuditFilter = 'All' | 'Status update' | 'Access';

export function AuditLog() {
  const { state } = useDemo();
  const [q, setQ] = useState('');
  const [kind, setKind] = useState<AuditFilter>('All');
  const all = auditRows(state);
  const t = q.trim().toLowerCase();
  const found = all.filter(r => !t || [r.actor, r.facility, r.patientId, person(r.patientId).name, r.what, r.appointmentId ?? '']
    .some(f => f.toLowerCase().includes(t)));
  const rows = found.filter(r => kind === 'All' || r.kind === kind);
  return (
    <div>
      <div className="page-head">
        <h1 className="page-title">Audit log</h1>
        <span className="muted">Every status written and every access checked. Nothing here can be edited or removed.</span>
      </div>
      <div className="test-filters">
        <input className="input" type="search" aria-label="Search the audit log" placeholder="Search a person, facility, patient or appointment"
          value={q} onChange={e => setQ(e.target.value)} />
        <Tabs<AuditFilter> label="Show" value={kind} onChange={setKind} items={[
          { id: 'All', label: 'All', count: found.length },
          { id: 'Status update', label: 'Status updates', count: found.filter(r => r.kind === 'Status update').length },
          { id: 'Access', label: 'Access', count: found.filter(r => r.kind === 'Access').length },
        ]} />
      </div>
      <div className="table-card">
        <table className="queue">
          <thead><tr><th scope="col">When</th><th scope="col">Who</th><th scope="col">Facility</th><th scope="col">Patient</th><th scope="col">What</th></tr></thead>
          <tbody>
            {rows.slice(0, 80).map((r, i) => (
              <tr key={i}>
                <td className="tabular nowrap">{fmt(r.at)}</td>
                <td>{r.actor}</td>
                <td>{r.facility}</td>
                <td>{person(r.patientId).name}<span className="muted small tabular"> · {r.patientId}</span></td>
                <td>{r.kind === 'Access' ? <Chip>{r.what}</Chip> : <>{r.what}{r.appointmentId && <span className="muted small tabular"> · {r.appointmentId}</span>}</>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <div className="empty"><span className="empty__title">Nothing matches.</span></div>}
      </div>
      <p className="footnote">{rows.length > 80 ? `Showing the newest 80 of ${rows.length}.` : `${rows.length} entries.`} Synthetic records.</p>
    </div>
  );
}

/* ---------- Reported issues ---------- */

type IssueFilter = 'Open' | 'Resolved';

export function ReportedIssues() {
  const { state, resolveIssue } = useDemo();
  const [filter, setFilter] = useState<IssueFilter>('Open');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const list = state.issues.filter(i => i.status === filter);
  return (
    <div>
      <div className="page-head">
        <h1 className="page-title">Reported issues</h1>
        <span className="muted">Problems facilities send from their portal</span>
      </div>
      <Tabs<IssueFilter> label="Show" value={filter} onChange={setFilter} items={[
        { id: 'Open', label: 'Open', count: state.issues.filter(i => i.status === 'Open').length },
        { id: 'Resolved', label: 'Resolved', count: state.issues.filter(i => i.status === 'Resolved').length },
      ]} />
      <div className="stack">
        {list.map(i => (
          <Card key={i.id} title={`${i.topic} · ${i.facility}`}>
            <p className="m0">{i.text}</p>
            <p className="muted small">Reported by {i.by} on <span className="tabular">{fmt(i.at)}</span> · <span className="tabular">{i.id}</span></p>
            {i.status === 'Resolved' ? (
              <p className="issue-resolved"><Icon icon={CheckCircle2} size={16} />Resolved <span className="tabular">{fmt(i.resolvedAt!)}</span>: {i.resolution}</p>
            ) : (
              <div className="issue-reply">
                <label className="field__label" htmlFor={`res-${i.id}`}>What was done</label>
                <textarea id={`res-${i.id}`} className="input input--area" rows={2} value={drafts[i.id] ?? ''}
                  onChange={e => setDrafts(d => ({ ...d, [i.id]: e.target.value }))} placeholder="The facility sees this reply." />
                <Button size="md" disabled={!(drafts[i.id] ?? '').trim()} onClick={() => resolveIssue(i.id, drafts[i.id].trim())}>Mark resolved</Button>
              </div>
            )}
          </Card>
        ))}
        {!list.length && <div className="empty"><span className="empty__title">{filter === 'Open' ? 'No open issues.' : 'Nothing resolved yet.'}</span></div>}
      </div>
    </div>
  );
}
