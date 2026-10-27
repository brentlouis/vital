import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Repeat, UserRound } from 'lucide-react';
import { Icon } from './ui';
import { DemoClock } from './DemoClock';
import { skipToMain } from './useScreenFocus';
import { Logo } from './Logo';
import { demoControlsOn } from './demoMode';

/* The session bar is the only fixed portal element. Shared terminals: the signed-in
   person is always named, and switching user is always one click away. */
export function SessionBar({ name, line, facility, bell, switchable = true, shared = true }: {
  name: string; line: string;
  /** The facility whose terminal this is; the quick switch lists its staff. */
  facility?: string;
  /** The notification bell, when the viewer has notifications. */
  bell?: ReactNode;
  /** Show the Switch user control. */
  switchable?: boolean;
  /** False for personal (non-terminal) sessions such as the platform admin. */
  shared?: boolean;
}) {
  const to = `/staff?screen=s4${facility ? `&facility=${encodeURIComponent(facility)}` : ''}`;
  return (
    <header className="session">
      <span className="session__brand"><Logo height={22} /></span>
      <span className="session__user-icon"><Icon icon={UserRound} size={16} /></span>
      <div className="session__who">
        <span className="session__name">{name}</span>
        <span className="session__line">{line}</span>
      </div>
      <div className="session__end">
        {bell}
        {shared && <span className="session__terminal">Shared terminal</span>}
        {shared && switchable && (
          <Link to={to} className="btn btn--outline btn--sm btn--link">
            <Icon icon={Repeat} size={16} /> Switch user
          </Link>
        )}
      </div>
    </header>
  );
}

/* Prototype-only strip for jumping between screens and configurations. Not product UI, so
   it is hidden unless the URL asks for it (?demo). It always carries the demo clock. */
export function PrototypeBar({ children }: { children: ReactNode }) {
  if (!demoControlsOn()) return null;
  return (
    <div className="protobar">
      <a className="skip-link" href="#main" onClick={skipToMain}>Skip to the app</a>
      {children}
      <DemoClock />
    </div>
  );
}

export function PrototypeLabel({ children, spaced }: { children: ReactNode; spaced?: boolean }) {
  return <span className={spaced ? 'protobar__label protobar__label--spaced' : 'protobar__label'}>{children}</span>;
}
