import { useEffect, useState } from 'react';
import {
  Building2, Check, Clock, FileSearch, FileText, FlaskConical, Mail, Stethoscope,
  TriangleAlert, Upload, UserX, Users, type LucideIcon,
} from 'lucide-react';
import { BackButton, Button, Callout, Chip, ConfirmDialog, Icon, Pills, type DialogSpec } from '../../components/ui';
import { PrototypeBar, PrototypeLabel, SessionBar } from '../../components/PortalChrome';
import { Link } from 'react-router-dom';
import { useDemo } from '../../store/context';
import { fmt, fmtDate } from '../../domain/time';

/* This registration's reference. Submitting it (F2) puts it in the admin's verification
   queue (A1); the admin's decision shows here on F3. */
const REFERENCE = 'REG-2026-0148';

type Screen = 'f1' | 'f2' | 'f3' | 'f4' | 'f5';
const SCREENS: { id: Screen; label: string }[] = [
  { id: 'f1', label: 'F1 Registration' },
  { id: 'f2', label: 'F2 Credentials' },
  { id: 'f3', label: 'F3 Pending' },
  { id: 'f4', label: 'F4 Activation' },
  { id: 'f5', label: 'F5 Staff' },
];

type FacilityType = 'Rural health unit' | 'Clinic' | 'Laboratory';
const TYPES: { label: FacilityType; icon: LucideIcon; caps: Caps }[] = [
  { label: 'Rural health unit', icon: Building2, caps: { refer: true, receive: false } },
  { label: 'Clinic', icon: Stethoscope, caps: { refer: true, receive: true } },
  { label: 'Laboratory', icon: FlaskConical, caps: { refer: false, receive: true } },
];

/* Capabilities, not type, decide behaviour: what the staff portal shows and whether the
   facility can be booked. Type stays as a display and licensing label. */
interface Caps { refer: boolean; receive: boolean }
const CAP_ROWS: { key: keyof Caps; label: string; help: string }[] = [
  { key: 'refer', label: 'Refers appointments out', help: 'This facility creates referred appointments and sends patients to other facilities. Its staff get an outgoing queue.' },
  { key: 'receive', label: 'Receives appointments and offers tests', help: 'This facility accepts appointments booked by patients or referred by others, publishes its day schedule, and declares the tests it performs.' },
];

const FIELDS: { key: keyof Form; label: string; placeholder: string; wide?: boolean }[] = [
  { key: 'name', label: 'Facility name', placeholder: 'Loon Heritage Clinical Lab', wide: true },
  { key: 'address', label: 'Street address', placeholder: 'Barangay, street', wide: true },
  { key: 'licence', label: 'DOH or LTO licence number', placeholder: 'LTO-BOH-0000-0000' },
  { key: 'admin', label: 'Admin contact name', placeholder: 'Full name' },
  { key: 'email', label: 'Admin email', placeholder: 'name@facility.ph' },
  { key: 'mobile', label: 'Admin mobile', placeholder: '+63 9XX XXX XXXX' },
];

const MUNICIPALITIES = ['Loon', 'Tagbilaran', 'Dauis', 'Panglao', 'Baclayon', 'Loboc', 'Maribojoc', 'Cortes', 'Antequera', 'Calape'];
const ROLES = ['Facility admin', 'Staff', 'Read-only'];

const DOCS = [
  { key: 'licence' as const, title: 'DOH licence or LTO permit', help: 'The permit that authorises this facility to operate. A photo of the printed permit is accepted.', file: 'lto-permit-0417.pdf', size: '412 KB' },
  { key: 'permit' as const, title: 'Business permit', help: 'Current mayor’s or business permit for the municipality named above.', file: 'loon-business-permit-2026.pdf', size: '288 KB' },
];

interface Form {
  name: string; type: FacilityType; municipality: string; address: string;
  licence: string; admin: string; email: string; mobile: string;
}
type StaffStatus = 'Active' | 'Invited' | 'Deactivated';
interface Staff { name: string; email: string; role: string; status: StaffStatus; last: string }

const STAFF_BADGE: Record<StaffStatus, { icon: LucideIcon; tone: string }> = {
  Active: { icon: Check, tone: 'done' },
  Invited: { icon: Mail, tone: 'waiting' },
  Deactivated: { icon: UserX, tone: 'waiting' },
};

/* F1–F5 — how a facility gets onto VITAL: register, upload credentials, wait for review,
   activate, then run its own staff list. */
export function FacilityOnboarding() {
  const [screen, setScreen] = useState<Screen>('f1');
  const { state, now, submitRegistration } = useDemo();
  const registration = state.registrations.find(r => r.reference === REFERENCE);
  const [form, setFormState] = useState<Form>({
    name: 'Loon Heritage Clinical Lab', type: 'Laboratory', municipality: 'Loon',
    address: 'Barangay Cogon Norte, Loon, Bohol', licence: 'LTO-BOH-2026-0417',
    admin: 'Editha Bughao', email: 'ebughao@loonheritagelab.ph', mobile: '+63 917 402 8815',
  });
  const [caps, setCaps] = useState<Caps>({ refer: false, receive: true });
  const [docs, setDocs] = useState({ licence: false, permit: false });
  /* Declared test coverage. referral = only accepted when an RHU books it. */
  const [tests, setTests] = useState([
    { name: 'CBC', offered: true, referral: false },
    { name: 'Fasting blood sugar', offered: true, referral: false },
    { name: 'Urinalysis', offered: true, referral: false },
    { name: 'Chest X-ray', offered: true, referral: true },
    { name: 'Rabies vaccination', offered: false, referral: false },
    { name: 'Lipid profile', offered: false, referral: false },
    { name: 'Sputum smear', offered: true, referral: true },
    { name: 'Pregnancy test', offered: true, referral: false },
  ]);
  const [activate, setActivate] = useState({ pw: '', pw2: '', terms: false });
  const [invite, setInvite] = useState({ email: '', role: 'Staff' });
  const [staff, setStaff] = useState<Staff[]>([
    { name: 'E. Bughao', email: 'ebughao@loonheritagelab.ph', role: 'Facility admin', status: 'Active', last: '15 Sep · 07:12' },
    { name: 'M. Cabahug', email: 'mcabahug@loonheritagelab.ph', role: 'Staff', status: 'Active', last: '15 Sep · 08:40' },
    { name: 'T. Salgarino', email: 'tsalgarino@loonheritagelab.ph', role: 'Staff', status: 'Invited', last: 'Not yet' },
    { name: 'L. Gantuangco', email: 'lgantuangco@loonheritagelab.ph', role: 'Read-only', status: 'Active', last: '12 Sep · 15:58' },
    { name: 'F. Omandam', email: 'fomandam@loonheritagelab.ph', role: 'Staff', status: 'Deactivated', last: '28 Aug · 16:04' },
  ]);
  const [dialog, setDialog] = useState<DialogSpec | null>(null);

  useEffect(() => { document.title = 'VITAL — Facility onboarding'; }, []);
  useEffect(() => { window.scrollTo(0, 0); }, [screen]);

  const setForm = (key: keyof Form, value: string) => setFormState(f => ({ ...f, [key]: value }));
  const toggleCap = (key: keyof Caps) => setCaps(c => ({ ...c, [key]: !c[key] }));

  const capSummary = caps.refer && caps.receive
    ? 'Both ticked: staff see one queue with outgoing and incoming filters, and can place internal orders with this facility’s own laboratory.'
    : caps.refer ? 'Refers out only: staff see the appointments this facility sends.'
      : caps.receive ? 'Receives only: staff see the appointments sent here.'
        : 'Tick at least one capability. A facility with neither has nothing for its staff to do.';
  const capLine = caps.refer && caps.receive ? 'Refers out and receives'
    : caps.refer ? 'Refers out only' : caps.receive ? 'Receives appointments' : 'None declared';

  const offered = tests.filter(t => t.offered);
  const referralOnly = offered.filter(t => t.referral);
  const testsSummary = offered.length === 0
    ? 'No tests declared yet. A facility with no declared tests never appears in patient facility search.'
    : `${offered.length} test${offered.length === 1 ? '' : 's'} declared`
      + (referralOnly.length ? ` · ${referralOnly.map(t => t.name).join(', ')} only with an RHU referral` : ' · all bookable directly by patients');

  const docsBlocked = !(docs.licence && docs.permit);
  const noCaps = !caps.refer && !caps.receive;
  const aBlocked = !(activate.pw.length >= 10 && activate.pw === activate.pw2 && activate.terms);
  const ivBlocked = !/.+@.+\..+/.test(invite.email);

  const sendInvite = () => {
    if (ivBlocked) return;
    const local = invite.email.split('@')[0];
    const name = local.charAt(0).toUpperCase() + '. ' + (local.slice(1, 2).toUpperCase() + local.slice(2)).replace(/[^a-zA-Z]/g, '');
    setStaff(s => [...s, { name, email: invite.email, role: invite.role, status: 'Invited', last: 'Not yet' }]);
    setInvite({ email: '', role: 'Staff' });
  };

  const capRows = (compact: boolean) => CAP_ROWS.map(c => (
    <label key={c.key} className={['cap-row', compact && 'cap-row--compact', caps[c.key] && 'cap-row--on'].filter(Boolean).join(' ')}>
      <input type="checkbox" checked={caps[c.key]} onChange={() => toggleCap(c.key)} />
      <span className="cap-row__text">
        <span className="cap-row__label">{c.label}</span>
        <span className="cap-row__help">{c.help}</span>
      </span>
    </label>
  ));

  return (
    <div className="portal" data-density="compact">
      <PrototypeBar>
        <PrototypeLabel>Prototype screens</PrototypeLabel>
        <Pills items={SCREENS} value={screen} onChange={setScreen} />
      </PrototypeBar>
      {screen === 'f5'
        ? <SessionBar name="E. Bughao" line="Facility admin · Loon Heritage Clinical Lab" switchable={false} />
        : (
          <header className="public-bar">
            <span className="session__brand">VITAL</span>
            <span className="session__line">Facility registration</span>
          </header>
        )}

      <main className="portal__main">
        {screen === 'f1' && (
          <div className="narrow-760">
            <h1 className="page-title upload__title">Register your facility</h1>
            <p className="page-sub">Step 1 of 3. A VITAL administrator reviews every registration before the facility can receive appointments.</p>
            <div className="card stack">
              <div>
                <span className="group-label">Facility type</span>
                <div className="choice-row">
                  {TYPES.map(t => (
                    <button key={t.label} type="button" className="type-option" aria-pressed={form.type === t.label}
                      onClick={() => { setFormState(f => ({ ...f, type: t.label })); setCaps(t.caps); }}>
                      <Icon icon={t.icon} size={16} />{t.label}
                    </button>
                  ))}
                </div>
                <p className="group-note">Type is a display and licensing label. What your staff can do is set by the capabilities below, and it cannot be changed after activation.</p>
              </div>

              <div>
                <span className="group-label group-label--tight">Capabilities</span>
                <p className="group-text">These decide what this facility can do. A clinic commonly does both. The facility admin can change them later.</p>
                <div className="table-card">{capRows(false)}</div>
                <p className={noCaps ? 'group-note amber' : 'group-note'}>{capSummary}</p>
              </div>

              <div className="field-grid">
                {FIELDS.map(f => (
                  <label key={f.key} className={f.wide ? 'field-sm field-sm--wide' : 'field-sm'}>
                    <span className="muted">{f.label}</span>
                    <input type="text" className="input" value={form[f.key]} placeholder={f.placeholder}
                      onChange={e => setForm(f.key, e.target.value)} />
                  </label>
                ))}
                <label className="field-sm">
                  <span className="muted">Municipality</span>
                  <select className="input" value={form.municipality} onChange={e => setForm('municipality', e.target.value)}>
                    {MUNICIPALITIES.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </label>
              </div>

              {caps.receive && (
                <div>
                  <span className="group-label group-label--tight">Tests offered</span>
                  <p className="group-text">Tick every test this facility performs. Tick <span className="strong">needs RHU referral</span> where the test is only accepted when a rural health unit books it — a patient will not be able to book that test here from their wallet.</p>
                  <div className="table-card">
                    {tests.map((t, i) => (
                      <div key={t.name} className={t.offered ? 'test-row test-row--on' : 'test-row'}>
                        <label className="test-row__name">
                          <input type="checkbox" checked={t.offered}
                            onChange={e => setTests(ts => ts.map((q, j) => j === i ? { ...q, offered: e.target.checked, referral: e.target.checked ? q.referral : false } : q))} />
                          <span className={t.offered ? 'strong' : undefined}>{t.name}</span>
                        </label>
                        <label className={['test-row__ref', !t.offered && 'test-row__ref--off', t.referral && 'amber'].filter(Boolean).join(' ')}>
                          <input type="checkbox" checked={t.referral} disabled={!t.offered}
                            onChange={e => setTests(ts => ts.map((q, j) => j === i ? { ...q, referral: e.target.checked } : q))} />
                          <span>Needs RHU referral</span>
                        </label>
                      </div>
                    ))}
                  </div>
                  <p className="group-note">{testsSummary}</p>
                </div>
              )}

              <div className="inline-actions">
                <Button size="md" disabled={noCaps} onClick={() => setScreen('f2')}>Continue to credentials</Button>
                <span className="muted xs">Synthetic data. Never register a real facility from a prototype.</span>
              </div>
            </div>
          </div>
        )}

        {screen === 'f2' && (
          <div className="narrow-760">
            <BackButton onClick={() => setScreen('f1')}>Facility details</BackButton>
            <h1 className="page-title upload__title">Upload credentials</h1>
            <p className="page-sub">Step 2 of 3. {form.name} · {form.type} · {form.municipality}</p>
            <Callout tone="amber" icon={TriangleAlert} title="Activation requires review" className="callout--tight">
              <p>A VITAL administrator checks these documents against the licence number you entered. Until that review is finished your facility cannot receive appointments, does not appear in patient facility search, and holds no consent grants.</p>
            </Callout>
            <div className="card stack">
              {DOCS.map(d => (
                <div key={d.key}>
                  <h2 className="upload__step upload__step--tight">{d.title}</h2>
                  <p className="page-sub page-sub--8">{d.help}</p>
                  {docs[d.key] ? (
                    <div className="tile">
                      <span className="tile__icon"><Icon icon={FileText} /></span>
                      <div className="tile__text">
                        <span className="tile__name">{d.file}</span>
                        <span className="tile__meta">{d.size} · attached just now</span>
                      </div>
                      <Button variant="outline" className="tile__end" onClick={() => setDocs(x => ({ ...x, [d.key]: false }))}>Remove</Button>
                    </div>
                  ) : (
                    <button type="button" className="dropzone" onClick={() => setDocs(x => ({ ...x, [d.key]: true }))}>
                      <Icon icon={Upload} /> Choose a PDF or photo of the document
                    </button>
                  )}
                </div>
              ))}
              <div className="inline-actions">
                <Button size="md" disabled={docsBlocked} onClick={() => {
                  submitRegistration({
                    reference: REFERENCE, name: form.name, type: form.type, municipality: form.municipality,
                    licence: form.licence, submitted: now, address: form.address, admin: form.admin,
                    email: form.email, mobile: form.mobile,
                    documents: DOCS.map(d => ({ title: d.title, file: d.file, size: d.size, uploaded: now })),
                    status: 'Pending', reason: null,
                  });
                  setScreen('f3');
                }}>Send for verification</Button>
                <span className="muted small">{docsBlocked ? 'Attach both documents first.' : 'Review usually finishes within two working days.'}</span>
              </div>
            </div>
          </div>
        )}

        {screen === 'f3' && (
          <div className="narrow-620">
            <h1 className="page-title upload__title">Waiting for verification</h1>
            <p className="page-sub">Step 3 of 3. {form.name} · reference {REFERENCE}</p>
            {!registration && (
              <Callout tone="keylime" icon={Clock} title="Nothing has been sent yet" className="callout--tight">
                <p>Attach both documents on the previous step and send them for verification.</p>
              </Callout>
            )}
            {registration?.status === 'Approved' && (
              <Callout tone="keylime" icon={Check} title={`Approved on ${fmt(registration.decidedAt ?? now)}`}>
                <p>A VITAL administrator checked your documents. The activation link was emailed to {registration.email}.</p>
                <Button size="md" className="self-start" onClick={() => setScreen('f4')}>Open the activation link</Button>
              </Callout>
            )}
            {registration?.status === 'Rejected' && (
              <Callout tone="clay" icon={TriangleAlert} title="The registration was not approved">
                <p>{registration.reason}</p>
                <Button size="md" variant="outline" className="self-start" onClick={() => setScreen('f2')}>Correct the documents and send again</Button>
              </Callout>
            )}
            <div className="card stack">
              <div className="inline-actions">
                {registration?.status === 'Approved'
                  ? <span className="badge badge--done"><Icon icon={Check} size={14} /> Verified</span>
                  : registration?.status === 'Rejected'
                    ? <span className="badge badge--fail"><Icon icon={TriangleAlert} size={14} /> Not approved</span>
                    : <span className="badge badge--attention"><Icon icon={Clock} size={14} /> Pending verification</span>}
                {registration && <span className="muted small tabular">Submitted {fmt(registration.submitted)}</span>}
              </div>
              <div className="steps">
                <span className="bold forest">What happens next</span>
                {[
                  { icon: FileSearch, text: 'A VITAL administrator opens your documents and checks the licence number against the DOH or LTO register.' },
                  { icon: Mail, text: `You are emailed an activation link at ${form.email} once the facility is approved.` },
                  { icon: Users, text: 'You set a password, become the facility admin, and invite your staff by email.' },
                ].map(n => (
                  <div key={n.text} className="trail__item">
                    <span className="trail__icon forest"><Icon icon={n.icon} /></span>
                    <span>{n.text}</span>
                  </div>
                ))}
              </div>
              <div className="readback readback--4">
                <span className="bold">Expected within two working days</span>
                <span>If a document is unreadable or the licence number does not match, you are told by email and can upload again. Nothing you send is visible to patients until the facility is activated.</span>
              </div>
              <p className="muted small m0">There is nothing to sign in to yet. The activation link arrives at {form.email}.</p>
              {registration?.status === 'Pending' && (
                <p className="xs muted m0">Prototype: review this registration in <Link to="/admin">Admin verification</Link> — this screen updates when it is decided.</p>
              )}
            </div>
          </div>
        )}

        {screen === 'f4' && (
          <div className="narrow-560">
            <h1 className="page-title upload__title">Activate {form.name}</h1>
            <p className="page-sub">You opened this from the activation email sent to {form.email}. The link expires 48 hours after it was sent.</p>
            <div className="card stack">
              <div className="readback">
                <span className="bold">{form.name}</span>
                <span>{form.type} · {form.municipality} · licence {form.licence}</span>
                <span className="muted">
                  {registration?.status === 'Approved'
                    ? `Verified by VITAL on ${fmtDate(registration.decidedAt ?? now)}. You become the facility admin.`
                    : 'Prototype: this facility has not been approved yet. In the product this link only exists after approval.'}
                </span>
              </div>
              <div className="form">
                <label className="field-sm">
                  <span className="muted">Set a password</span>
                  <input type="password" className="input" autoComplete="new-password" value={activate.pw}
                    placeholder="At least 10 characters" onChange={e => setActivate(a => ({ ...a, pw: e.target.value }))} />
                </label>
                <label className="field-sm">
                  <span className="muted">Repeat the password</span>
                  <input type="password" className="input" autoComplete="new-password" value={activate.pw2}
                    onChange={e => setActivate(a => ({ ...a, pw2: e.target.value }))} />
                </label>
              </div>
              <label className="confirm small">
                <input type="checkbox" checked={activate.terms} onChange={e => setActivate(a => ({ ...a, terms: e.target.checked }))} />
                <span>I accept the VITAL facility terms and the Data Privacy Act obligations they set out: this facility reads a patient record only under an active consent grant, and every read and status event is written to the audit log against a named user.</span>
              </label>
              <div className="inline-actions">
                <Button size="md" disabled={aBlocked} onClick={() => setScreen('f5')}>Activate facility</Button>
                <span className="muted small">
                  {activate.pw.length < 10 ? 'Use at least 10 characters.'
                    : activate.pw !== activate.pw2 ? 'The two passwords do not match.'
                      : !activate.terms ? 'Accept the terms to continue.'
                        : 'You become the facility admin for this facility.'}
                </span>
              </div>
            </div>
          </div>
        )}

        {screen === 'f5' && (
          <div>
            <div className="page-head">
              <h1 className="page-title">Staff</h1>
              <span className="muted tabular">{staff.length} staff · {staff.filter(p => p.status === 'Active').length} active</span>
              <span className="page-head__end">Loon Heritage Clinical Lab</span>
            </div>

            <section className="card stack-8 narrow-760 mb16">
              <div className="inline-actions inline-actions--baseline">
                <h2 className="card__title m0">Capabilities</h2>
                <Chip>{form.type} · {capLine}</Chip>
              </div>
              <p className="muted small m0">Declared at registration. You can change these; the change is written to the facility record with your name.</p>
              {capRows(true)}
              <p className={noCaps ? 'xs amber m0' : 'xs muted m0'}>{capSummary}</p>
            </section>

            <section className="card stack-8 narrow-760 mb16">
              <h2 className="card__title m0">Invite a staff member</h2>
              <p className="muted small m0">They receive an email link, set their own password and a quick-switch PIN. Their name — not this terminal — is written to the status trail of everything they do.</p>
              <div className="invite">
                <label className="field-sm invite__email">
                  <span className="muted">Work email</span>
                  <input type="email" className="input" value={invite.email} placeholder="name@loonheritagelab.ph"
                    onChange={e => setInvite(v => ({ ...v, email: e.target.value }))}
                    onKeyDown={e => { if (e.key === 'Enter') sendInvite(); }} />
                </label>
                <label className="field-sm">
                  <span className="muted">Role</span>
                  <select className="input" value={invite.role} onChange={e => setInvite(v => ({ ...v, role: e.target.value }))}>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </label>
                <Button size="md" icon={Mail} disabled={ivBlocked} onClick={sendInvite}>Send invite</Button>
              </div>
            </section>

            <div className="table-card">
              <table className="queue">
                <colgroup>
                  <col style={{ width: '22%' }} /><col style={{ width: '26%' }} /><col style={{ width: 150 }} />
                  <col style={{ width: 150 }} /><col style={{ width: 170 }} /><col style={{ width: 150 }} />
                </colgroup>
                <thead>
                  <tr>
                    <th scope="col">Name</th><th scope="col">Email</th><th scope="col">Role</th><th scope="col">Status</th>
                    <th scope="col" className="num">Last signed in</th><th scope="col" className="num">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((p, i) => {
                    const b = STAFF_BADGE[p.status];
                    return (
                      <tr key={p.email} className="queue__row queue__row--static">
                        <td className="queue__patient">{p.name}</td>
                        <td className="muted">{p.email}</td>
                        <td>{p.role}</td>
                        <td><span className={`badge badge--${b.tone}`}><Icon icon={b.icon} size={14} />{p.status}</span></td>
                        <td className="num muted tabular nowrap">{p.last}</td>
                        <td className="num queue__action">
                          {p.status !== 'Deactivated' && p.role !== 'Facility admin' && (
                            <Button variant="danger-outline" onClick={() => setDialog({
                              title: `Deactivate ${p.name}?`,
                              body: `${p.name} will not be able to sign in to Loon Heritage Clinical Lab and will write no further status events. Everything they already recorded stays in the status trail and the audit log. You can reactivate them later.`,
                              action: 'Deactivate user', cancel: 'Keep active',
                              onConfirm: () => { setStaff(s => s.map((q, j) => j === i ? { ...q, status: 'Deactivated' } : q)); setDialog(null); },
                            })}>Deactivate</Button>
                          )}
                          {p.status === 'Deactivated' && (
                            <Button variant="outline" onClick={() => setStaff(s => s.map((q, j) => j === i ? { ...q, status: 'Invited', last: 'Not yet' } : q))}>Reactivate</Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="footnote">A deactivated user cannot sign in and cannot write status events. Everything they already wrote stays in the status trail and the audit log.</p>
          </div>
        )}
      </main>

      <ConfirmDialog spec={dialog} onClose={() => setDialog(null)} />
    </div>
  );
}
