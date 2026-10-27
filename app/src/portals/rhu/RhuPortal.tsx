import { useEffect } from 'react';
import { ConfirmDialog, Pills, Toast } from '../../components/ui';
import { PrototypeBar, PrototypeLabel, SessionBar } from '../../components/PortalChrome';
import { AccessDenied } from '../../components/AccessDenied';
import { RHU, person } from '../../domain/reference';
import { FacilityBell } from '../../components/FacilityBell';
import { useRhu, type Screen } from './useRhu';
import { PatientSearch, RhuQueue, RhuWorkspace } from './screens/RhuQueue';
import { ReferralForm } from '../../components/referral/ReferralForm';
import { RhuDetail } from './screens/RhuDetail';
import { useScreenFocus } from '../../components/useScreenFocus';
import { PortalNav } from '../../components/PortalNav';
import { useWide } from '../../components/useWide';
import { CreditCard, FilePlus, ListChecks, MessageSquareWarning, Users } from 'lucide-react';
import { PlanUsage, ReportProblem } from '../../components/FacilityAccount';

const SCREENS: { id: Screen; label: string }[] = [
  { id: 'queue', label: 'R1 Appointment queue' },
  { id: 'new', label: 'R2 Create appointment' },
  { id: 'detail', label: 'R3–R6 Appointment detail' },
  { id: 'search', label: 'R7 Patient search' },
  { id: 'denied', label: 'R8 Access denied' },
];

/* RHU / health-centre portal — the referring side. Desktop, shared terminal, compact. */
export function RhuPortal() {
  const rhu = useRhu();
  const { screen, selected } = rhu;

  useEffect(() => { document.title = 'VITAL — RHU portal'; }, []);
  useScreenFocus([screen, selected?.id]);
  const wide = useWide();
  type NavId = 'queue' | 'new' | 'search' | 'plan' | 'report';
  const navValue: NavId | null = (['new', 'search', 'plan', 'report'] as Screen[]).includes(screen) ? screen as NavId : 'queue';

  return (
    <div className="portal" data-density="compact">
      <SessionBar name={rhu.viewer.name} line={`${rhu.title} · ${RHU}`} facility={RHU}
        bell={<FacilityBell facility={RHU} onOpen={rhu.openDetail} />} />
      <PrototypeBar>
        <PrototypeLabel>Prototype screens</PrototypeLabel>
        <Pills items={SCREENS} value={screen} onChange={rhu.setScreen} />
      </PrototypeBar>

      <div className="portal__body">
      <PortalNav<NavId> label="Health centre" value={navValue} onChange={rhu.setScreen} items={[
        { id: 'queue', label: 'Appointments', icon: ListChecks, count: rhu.buckets['Needs follow-up'].length },
        { id: 'new', label: 'New appointment', icon: FilePlus },
        { id: 'search', label: 'Patients', icon: Users },
        { id: 'plan', label: 'Plan and usage', icon: CreditCard },
        { id: 'report', label: 'Report a problem', icon: MessageSquareWarning },
      ]} />
      <main className="portal__main">
        {wide && (screen === 'queue' || screen === 'detail') && <RhuWorkspace rhu={rhu} />}
        {!wide && screen === 'queue' && <RhuQueue rhu={rhu} />}
        {screen === 'new' && <ReferralForm rf={rhu.referral} onSend={rhu.send} onDiscard={() => rhu.setScreen('queue')} />}
        {!wide && screen === 'detail' && selected && <RhuDetail rhu={rhu} sel={selected} />}
        {screen === 'search' && <PatientSearch rhu={rhu} />}
        {screen === 'plan' && <PlanUsage facility={RHU} />}
        {screen === 'report' && <ReportProblem facility={RHU} staff={rhu.viewer.name} />}
        {screen === 'denied' && <AccessDenied facility={RHU} backLabel="Appointment queue" onBack={() => rhu.setScreen('queue')}
          patient={rhu.deniedFor ? person(rhu.deniedFor).name : undefined} />}
      </main>
      </div>

      <ConfirmDialog spec={rhu.dialog} onClose={() => rhu.setDialog(null)} />
      <Toast toast={rhu.toast} onClose={() => rhu.setToast(null)} />
    </div>
  );
}
