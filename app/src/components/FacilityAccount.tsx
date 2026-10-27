import { useState } from 'react';
import { CheckCircle2, Send } from 'lucide-react';
import { Button, Card, Facts, Icon } from './ui';
import { useDemo } from '../store/context';
import { FACILITY_PLAN, PLAN_PRICES } from '../domain/reference';
import { activePatients } from '../domain/measures';
import { fmt } from '../domain/time';
import type { Issue } from '../domain/types';

/* A facility's own account: its plan and what it is billed on (business model), and a way to
   report a problem to the VITAL team (function 11). Billing itself is not part of the pilot. */

const peso = (n: number) => `₱${n.toLocaleString('en-PH')}`;

export function PlanUsage({ facility }: { facility: string }) {
  const { state, now } = useDemo();
  const plan = FACILITY_PLAN[facility] ?? 'Premium';
  const active = activePatients(state, facility, now);
  const tier = PLAN_PRICES.find(p => p.plan === plan && active <= p.max) ?? PLAN_PRICES.filter(p => p.plan === plan).slice(-1)[0];
  const other = PLAN_PRICES.find(p => p.plan !== plan && p.bracket === tier.bracket)!;
  return (
    <div className="stack">
      <div className="page-head">
        <h1 className="page-title">Plan and usage</h1>
        <span className="muted">{facility}</span>
      </div>
      <div className="stats">
        <div className="stat stat--lead">
          <span className="stat__label">Your plan</span>
          <span className="stat__value">{plan}</span>
          <span className="stat__note">{tier.bracket} active patients · {peso(tier.monthly)} a month ({peso(tier.monthly * 12)} a year)</span>
        </div>
        <div className="stat">
          <span className="stat__label">Active patients now</span>
          <span className="stat__value tabular">{active}</span>
          <span className="stat__note">of {tier.max} in this bracket</span>
        </div>
      </div>
      <Card title="What the plans include">
        <Facts rows={[
          ['Premium', 'Digital referrals, status trail, results delivery, appointments and notifications.'],
          ['Premium+', 'Everything in Premium, plus priority referral recommendations: each laboratory’s typical turnaround and acceptance rate when you refer, with sorting by fastest or closest. Specialist matching for transfers follows in a later phase. Recommendations never change how facilities are ranked.'],
          [`${other.plan} at your size`, `${peso(other.monthly)} a month`],
        ]} />
      </Card>
      <p className="footnote">Active patients: anyone with an appointment your facility sent or receives that is still open, or closed in the last 30 days. Prices are a planning assumption until the pilot validates them; nothing is billed during the pilot. Patients never pay.</p>
    </div>
  );
}

const TOPICS: Issue['topic'][] = ['Wrong or missing data', 'Access or sign-in', 'Something does not work', 'Other'];

export function ReportProblem({ facility, staff }: { facility: string; staff: string }) {
  const { state, reportIssue } = useDemo();
  const [topic, setTopic] = useState<Issue['topic'] | ''>('');
  const [text, setText] = useState('');
  const [sent, setSent] = useState(false);
  const mine = state.issues.filter(i => i.facility === facility);
  const send = () => {
    if (!topic || !text.trim()) return;
    reportIssue({ facility, by: staff, topic, text: text.trim() });
    setTopic(''); setText(''); setSent(true);
  };
  return (
    <div className="stack">
      <div className="page-head">
        <h1 className="page-title">Report a problem</h1>
        <span className="muted">Goes to the VITAL team. Do not include patient details beyond an appointment ID.</span>
      </div>
      <Card title="New report">
        <div className="stack-8">
          <span className="field__label">What is it about?</span>
          <div className="choice-row">
            {TOPICS.map(t => (
              <button key={t} type="button" className="toggle" aria-pressed={topic === t} onClick={() => { setTopic(t); setSent(false); }}>{t}</button>
            ))}
          </div>
          <label className="field__label" htmlFor="issue-text">What happened</label>
          <textarea id="issue-text" className="input input--area" rows={4} value={text} onChange={e => { setText(e.target.value); setSent(false); }}
            placeholder="What you did, what you expected, and the appointment ID if there is one." />
          <div className="choice-row">
            <Button size="md" icon={Send} disabled={!topic || !text.trim()} onClick={send}>Send report</Button>
            {sent && <span className="issue-resolved"><Icon icon={CheckCircle2} size={16} />Sent. You will see the reply below.</span>}
          </div>
        </div>
      </Card>
      <Card title="Your reports">
        {mine.length ? (
          <ul className="issue-list">
            {mine.map(i => (
              <li key={i.id}>
                <span className="strong">{i.topic}</span> <span className="muted small tabular">· {i.id} · {fmt(i.at)} · {i.status}</span>
                <span className="small">{i.text}</span>
                {i.resolution && <span className="issue-resolved small"><Icon icon={CheckCircle2} size={14} />{i.resolution}</span>}
              </li>
            ))}
          </ul>
        ) : <p className="muted small m0">No reports yet.</p>}
      </Card>
    </div>
  );
}
