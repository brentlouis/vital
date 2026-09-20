import { Link, Navigate, Route, Routes } from 'react-router-dom';
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
  { path: '/admin', label: 'Admin verification', note: 'Platform admin · A1–A2',
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
