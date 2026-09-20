import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Repeat, UserRound } from 'lucide-react';
import { Icon } from './ui';
import { DemoClock } from './DemoClock';

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
      <span className="session__brand">VITAL</span>
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

/* Prototype-only strip for jumping between screens and configurations. Not product UI. It
   always carries the demo clock. */
export function PrototypeBar({ children }: { children: ReactNode }) {
  return (
    <div className="protobar">
      {children}
      <DemoClock />
    </div>
  );
}

export function PrototypeLabel({ children, spaced }: { children: ReactNode; spaced?: boolean }) {
  return <span className={spaced ? 'protobar__label protobar__label--spaced' : 'protobar__label'}>{children}</span>;
}
