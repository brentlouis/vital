import { useState } from 'react';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { useDemo } from './store/context';
import { LabPortal } from './portals/lab/LabPortal';
import { RhuPortal } from './portals/rhu/RhuPortal';
import { WalletApp } from './portals/wallet/WalletApp';
import { PatientOnboarding } from './portals/onboarding/PatientOnboarding';
import { FacilityOnboarding } from './portals/facility/FacilityOnboarding';
import { StaffAccess } from './portals/staff/StaffAccess';
import { AdminVerification } from './portals/admin/AdminVerification';

/* Each surface from the Claude Design bundle is its own route, and all of them read and write
   one shared store (src/store), so an action on one surface shows on the others.

   Listed in the order a walkthrough follows the real system: facilities join and are
   verified, staff sign in, a patient signs up, then one appointment travels from the
   referring health centre to the patient and the laboratory and back. */
const PORTALS = [
  { path: '/onboarding/facility', label: 'Facility onboarding', note: 'F1–F5',
    step: 'A health centre, clinic or laboratory registers and uploads its licence.' },
  { path: '/admin', label: 'Admin', note: 'Verification, pilot measures, audit log, issues · A1–A5',
    step: 'VITAL checks the documents and approves or rejects the facility.' },
  { path: '/staff', label: 'Staff access', note: 'Sign-in and quick switch · S1–S4',
    step: 'Staff accept their invite, sign in, and hand the shared terminal over by PIN.' },
  { path: '/onboarding/patient', label: 'Patient onboarding', note: 'Android · W1–W6',
    step: 'The patient verifies their mobile number, consents, and claims any waiting appointment.' },
  { path: '/rhu', label: 'RHU portal', note: 'Referring side · R1–R8',
    step: 'A provider decides a test is needed and sends a referral to a laboratory.' },
  { path: '/wallet', label: 'Patient wallet', note: 'Android · P1–P11',
    step: 'The patient follows the appointment, answers proposed times, and controls access.' },
  { path: '/lab', label: 'Laboratory portal', note: 'Receiving side · L1–L9',
    step: 'The laboratory receives, accepts, records arrival or no-show, and releases the result.' },
];

function Index() {
  const demo = useDemo();
  const [done, setDone] = useState(false);
  return (
    <div className="portal index">
      <h1 className="page-title">VITAL prototype</h1>
      <p className="muted">Synthetic records. Never place real patient data in a prototype.</p>
      <ol className="index__list">
        {PORTALS.map(p => (
          <li key={p.path}>
            <Link to={p.path}>{p.label}</Link> <span className="muted">· {p.note}</span>
            <span className="index__step">{p.step}</span>
          </li>
        ))}
      </ol>
      <p className="muted small">The loop closes back in the RHU portal, where the referring provider acknowledges the result.</p>

      <h2 className="index__h2">Other views</h2>
      <ul className="index__list index__list--plain">
        <li>
          <Link to={`/lab?facility=${encodeURIComponent('Tagbilaran Diagnostic Center')}`}>Laboratory portal as a clinic that refers and receives</Link>
          <span className="index__step">The same portal for a facility that also sends referrals: one queue with Incoming and Outgoing, and its own New appointment.</span>
        </li>
      </ul>

      <h2 className="index__h2">Demo data</h2>
      <p className="index__step">Every surface shares one set of records, saved in this browser. Reset to start the walkthrough from the beginning.</p>
      <div className="index__actions">
        <button type="button" className="btn btn--outline btn--md" onClick={() => { demo.reset(); setDone(true); }}>Reset demo data</button>
        {done && <span className="muted" role="status">Demo data reset.</span>}
      </div>
      <p className="muted small">The screen switcher and demo clock are hidden so each surface looks finished. Add <code>?demo</code> to any address to show them for this tab, or <code>?demo=off</code> to hide them again.</p>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/onboarding/facility" element={<FacilityOnboarding />} />
      <Route path="/admin" element={<AdminVerification />} />
      <Route path="/staff" element={<StaffAccess />} />
      <Route path="/onboarding/patient" element={<PatientOnboarding />} />
      <Route path="/rhu" element={<RhuPortal />} />
      <Route path="/wallet" element={<WalletApp />} />
      <Route path="/lab" element={<LabPortal />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
