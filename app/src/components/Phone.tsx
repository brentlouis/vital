import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';
import { DemoClock } from './DemoClock';

/* Material Symbols Rounded glyph — the wallet's icon set. Decorative unless labelled. */
export function Ms({ glyph, size = 24, style, className }: { glyph: string; size?: number; style?: CSSProperties; className?: string }) {
  return <span className={['ms', className].filter(Boolean).join(' ')} style={{ fontSize: size, ...style }} aria-hidden="true">{glyph}</span>;
}

/* The mint stage the phone sits on, with the prototype screen switcher above it. */
export function PhoneStage<T extends string>({ screens, value, onChange, pillStyle = 'muted', children }: {
  screens: { id: T; label: string }[];
  value: T | null;
  onChange: (id: T) => void;
  /** The wallet outlines every pill in forest; onboarding uses the input border. */
  pillStyle?: 'forest' | 'muted';
  children: ReactNode;
}) {
  return (
    <div className="stage">
      <div className="stage__pills">
        <span className="stage__label">Prototype screens</span>
        {screens.map(s => (
          <button key={s.id} type="button" className={`stage__pill stage__pill--${pillStyle}`} aria-pressed={s.id === value}
            onClick={() => onChange(s.id)}>{s.label}</button>
        ))}
      </div>
      <DemoClock />
      {children}
      <p className="stage__foot">Synthetic records. Never place real patient data in a prototype.</p>
    </div>
  );
}

/* A 390px Android frame: status bar, VITAL header, scrolling body, optional tab bar. */
export function Phone({ headerEnd, tabbar, children, bodyClassName }: {
  headerEnd?: ReactNode; tabbar?: ReactNode; children: ReactNode; bodyClassName?: string;
}) {
  return (
    <div className="phone" data-density="comfortable">
      <div className="phone__status tabular">
        <span>09:41</span>
        <span className="phone__status-icons">
          <Ms glyph="signal_cellular_alt" size={14} /><Ms glyph="wifi" size={14} /><Ms glyph="battery_full" size={14} />
        </span>
      </div>
      <div className={tabbar ? 'phone__header phone__header--tight' : 'phone__header'}>
        <span className="phone__brand">VITAL</span>
        {headerEnd}
      </div>
      <div className={['phone__body', tabbar ? 'phone__body--tabbed' : '', bodyClassName].filter(Boolean).join(' ')}>
        {children}
      </div>
      {tabbar && <nav className="phone__tabbar" aria-label="Wallet">{tabbar}</nav>}
    </div>
  );
}

/* ---- Mobile building blocks. 48dp targets, 16px body, 24px card padding. ---- */

type MButtonVariant = 'primary' | 'outline' | 'quiet' | 'danger' | 'danger-outline';

export function MButton({ variant = 'primary', tall, className, children, ...rest }:
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: MButtonVariant; tall?: boolean }) {
  const cls = ['mbtn', `mbtn--${variant}`, tall && 'mbtn--tall', className].filter(Boolean).join(' ');
  return <button type="button" className={cls} {...rest}>{children}</button>;
}

export function MBack({ onClick, children, glyph = 'arrow_back' }: { onClick: () => void; children: ReactNode; glyph?: string }) {
  return (
    <button type="button" className="mback" onClick={onClick}>
      <Ms glyph={glyph} />{children}
    </button>
  );
}

export function MHead({ title, children }: { title: ReactNode; children?: ReactNode }) {
  return (
    <div className="mhead">
      <h1 className="mtitle">{title}</h1>
      {children}
    </div>
  );
}

export function MBadge({ glyph, tone, children }: {
  glyph?: string; tone: 'waiting' | 'progress' | 'done' | 'fail' | 'attention'; children: ReactNode;
}) {
  return (
    <span className={`mbadge badge--${tone}`}>
      {glyph && <Ms glyph={glyph} size={16} />}
      {children}
    </span>
  );
}
