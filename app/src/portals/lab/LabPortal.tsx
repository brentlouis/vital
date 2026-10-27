import { useEffect } from 'react';
import { ConfirmDialog, Pills, Toast } from '../../components/ui';
import { PrototypeBar, PrototypeLabel, SessionBar } from '../../components/PortalChrome';
import { FacilityBell } from '../../components/FacilityBell';
import { CONFIGS, useLab, type Screen } from './useLab';
import { LabWorkspace, Queue } from './screens/Queue';
import { Detail } from './screens/Detail';
import { UploadResult } from './screens/UploadResult';
import { DaySchedule } from './screens/DaySchedule';
import { AccessDenied } from '../../components/AccessDenied';
import { ReferralForm } from '../../components/referral/ReferralForm';
import { useScreenFocus } from '../../components/useScreenFocus';
import { PortalNav } from '../../components/PortalNav';
import { useWide } from '../../components/useWide';
import { CalendarDays, CreditCard, FilePlus, Inbox, MessageSquareWarning } from 'lucide-react';
import { PlanUsage, ReportProblem } from '../../components/FacilityAccount';

type ScreenPill = Screen | 'noshow';

const SCREENS: { id: ScreenPill; label: string }[] = [
  { id: 'queue', label: 'L1 Incoming queue' },
  { id: 'detail', label: 'L2 / L4 / L5 Appointment detail' },
  { id: 'upload', label: 'L3 Upload result' },
  { id: 'day', label: 'L6 Day schedule' },
  { id: 'noshow', label: 'L7 Detail — no-show' },
  { id: 'denied', label: 'L8 Access denied' },
];

/* Only a facility with can_refer set creates outgoing appointments. */
const REFER_SCREENS: { id: ScreenPill; label: string }[] = [
  { id: 'new', label: 'L9 Create appointment' },
];

/* Laboratory portal — the receiving side. Desktop, shared terminal, compact density. */
export function LabPortal() {
  const lab = useLab();
  const { screen, selected } = lab;

  useEffect(() => { document.title = 'VITAL — Laboratory portal'; }, []);
  /* Each screen change starts at the top, as a page navigation would. */
  useScreenFocus([screen, selected?.id]);

  const wide = useWide();
  type NavId = 'queue' | 'day' | 'new' | 'plan' | 'report';
  const navValue: NavId | null = (['day', 'new', 'plan', 'report'] as Screen[]).includes(screen) ? screen as NavId : 'queue';
  const goNav = (id: NavId) => lab.setScreen(id);

  const activePill: ScreenPill = screen === 'detail' && selected?.status === 'No-show' ? 'noshow' : screen;
  const goPill = (id: ScreenPill) => (id === 'noshow' ? lab.openFirst('No-show') : lab.setScreen(id));

  return (
    <div className="portal" data-density="compact">
      <SessionBar name={lab.staff} line={`${lab.title} · ${lab.signedIn}`} facility={lab.signedIn}
        bell={<FacilityBell facility={lab.signedIn} onOpen={lab.openDetail} />} />

      <PrototypeBar>
        <PrototypeLabel>Prototype screens</PrototypeLabel>
        <Pills items={lab.merged ? [...SCREENS, ...REFER_SCREENS] : SCREENS} value={activePill} onChange={goPill} />
        <PrototypeLabel spaced>Facility</PrototypeLabel>
        <Pills items={[...CONFIGS]} value={lab.signedIn} onChange={lab.pickConfig} />
      </PrototypeBar>

      <div className="portal__body">
      <PortalNav<NavId> label="Laboratory" value={navValue} onChange={goNav} items={[
        { id: 'queue', label: lab.merged ? 'Appointments' : 'Incoming queue', icon: Inbox, count: lab.buckets.New.length },
        { id: 'day', label: 'Day schedule', icon: CalendarDays },
        ...(lab.merged ? [{ id: 'new' as const, label: 'New appointment', icon: FilePlus }] : []),
        { id: 'plan', label: 'Plan and usage', icon: CreditCard },
        { id: 'report', label: 'Report a problem', icon: MessageSquareWarning },
      ]} footer={
        /* A person with accounts at more than one facility switches between them here. */
        <label className="pnav__facility">
          <span className="pnav__facility-label">Facility</span>
          <select className="input" value={lab.signedIn} onChange={e => lab.pickConfig(e.target.value)}>
            {CONFIGS.map(c => <option key={c.id} value={c.id}>{c.id}</option>)}
          </select>
          <span className="pnav__facility-hint">{lab.merged ? 'Clinic · refers and receives' : 'Laboratory · receives only'}</span>
        </label>
      } />
      <main className="portal__main">
        {wide && (screen === 'queue' || screen === 'detail') && <LabWorkspace lab={lab} />}
        {!wide && screen === 'queue' && <Queue lab={lab} />}
        {!wide && screen === 'detail' && selected && <Detail lab={lab} sel={selected} />}
        {screen === 'upload' && selected && <UploadResult lab={lab} sel={selected} />}
        {screen === 'day' && <DaySchedule lab={lab} />}
        {screen === 'plan' && <PlanUsage facility={lab.signedIn} />}
        {screen === 'report' && <ReportProblem facility={lab.signedIn} staff={lab.viewer.name} />}
        {screen === 'new' && lab.merged && (
          <ReferralForm rf={lab.referral} onSend={lab.sendReferral} onDiscard={() => lab.setScreen('queue')} backLabel="Appointment queue" />
        )}
        {screen === 'denied' && <AccessDenied facility={lab.signedIn} backLabel="Queue" onBack={() => lab.setScreen('queue')} />}
      </main>
      </div>

      <ConfirmDialog spec={lab.dialog} onClose={() => lab.setDialog(null)} />
      <Toast toast={lab.toast} onClose={() => lab.setToast(null)} />
    </div>
  );
}
