import { useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Building2, ChevronLeft, Hospital, Smartphone, type LucideIcon } from 'lucide-react';
import type { Origin, Status } from '../domain/types';
import { STATUS_META } from '../domain/status';

/* Lucide at the system stroke: 1.5px, 20px default, 16px inside badges and buttons. */
export function Icon({ icon: I, size = 20 }: { icon: LucideIcon; size?: number }) {
  return <I size={size} strokeWidth={1.5} absoluteStrokeWidth={false} aria-hidden="true" className="icon" />;
}

export function StatusBadge({ status }: { status: Status }) {
  const m = STATUS_META[status];
  return (
    <span className={`badge badge--${m.group}`}>
      <Icon icon={m.icon} size={16} />
      {status}
    </span>
  );
}

export function Chip({ icon, children }: { icon?: LucideIcon; children: ReactNode }) {
  return (
    <span className="chip">
      {icon && <Icon icon={icon} size={14} />}
      {children}
    </span>
  );
}

export function OriginChip({ origin, children }: { origin: Origin; children?: ReactNode }) {
  const icon = origin === 'Personal' ? Smartphone : origin === 'Internal' ? Hospital : Building2;
  return <Chip icon={icon}>{children ?? origin}</Chip>;
}

type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'danger-outline' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

export function Button({
  variant = 'primary', size = 'sm', block, icon, children, className, ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant; size?: ButtonSize; block?: boolean; icon?: LucideIcon;
}) {
  const cls = ['btn', `btn--${variant}`, `btn--${size}`, block && 'btn--block', className].filter(Boolean).join(' ');
  return (
    <button type="button" className={cls} {...rest}>
      {icon && <Icon icon={icon} size={size === 'lg' ? 20 : 16} />}
      {children}
    </button>
  );
}

export function BackButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className="back" onClick={onClick}>
      <Icon icon={ChevronLeft} size={16} />
      {children}
    </button>
  );
}

/* Tinted panel with an icon. Amber is attention, clay is failure — both carry a 3px left
   border. Keylime is informational and takes a full hairline outline instead. */
export function Callout({
  tone, icon, title, children, className,
}: { tone: 'amber' | 'clay' | 'keylime'; icon: LucideIcon; title?: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <div className={['callout', `callout--${tone}`, className].filter(Boolean).join(' ')}>
      <span className="callout__icon"><Icon icon={icon} /></span>
      <div className="callout__body">
        {title && <span className="callout__title">{title}</span>}
        {children}
      </div>
    </div>
  );
}

export function Card({ title, children, className }: { title?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={['card', className].filter(Boolean).join(' ')}>
      {title && <h2 className="card__title">{title}</h2>}
      {children}
    </section>
  );
}

/* Label/value grid used on detail screens. */
export function Facts({ rows, inset, wide }: { rows: [ReactNode, ReactNode, boolean?][]; inset?: boolean; wide?: boolean }) {
  return (
    <dl className={['facts', inset && 'facts--inset', wide && 'facts--wide'].filter(Boolean).join(' ')}>
      {rows.map(([k, v, tabular], i) => (
        <div key={i} className="facts__row">
          <dt>{k}</dt>
          <dd className={tabular ? 'tabular' : undefined}>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export interface TabItem<T extends string> { id: T; label: string; count?: number }

export function Tabs<T extends string>({ items, value, onChange, label }: {
  items: TabItem<T>[]; value: T; onChange: (id: T) => void; label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="tabs" onKeyDown={e => {
      /* Arrow keys, Home and End move between tabs (WAI-ARIA tabs pattern). */
      const i = items.findIndex(t => t.id === value);
      const next = e.key === 'ArrowRight' ? (i + 1) % items.length
        : e.key === 'ArrowLeft' ? (i - 1 + items.length) % items.length
          : e.key === 'Home' ? 0 : e.key === 'End' ? items.length - 1 : -1;
      if (next < 0) return;
      e.preventDefault();
      onChange(items[next].id);
      const tabs = e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]');
      tabs[next]?.focus();
    }}>
      {items.map(t => (
        <button
          key={t.id} type="button" role="tab" aria-selected={t.id === value}
          tabIndex={t.id === value ? 0 : -1}
          className="tabs__tab" onClick={() => onChange(t.id)}
        >
          {t.label}
          {t.count !== undefined && <span className="tabs__count tabular">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

/* Segmented pill switcher used by the prototype chrome. */
export function Pills<T extends string>({ items, value, onChange }: {
  items: { id: T; label: string }[]; value: T | null; onChange: (id: T) => void;
}) {
  return (
    <div className="pills">
      {items.map(p => (
        <button key={p.id} type="button" className="pill" aria-pressed={p.id === value} onClick={() => onChange(p.id)}>
          {p.label}
        </button>
      ))}
    </div>
  );
}

/* Destructive confirmation. Names the consequence before the action is offered. */
export interface DialogSpec {
  title: string;
  body: string;
  action: string;
  cancel: string;
  onConfirm: () => void;
}

export function ConfirmDialog({ spec, onClose }: { spec: DialogSpec | null; onClose: () => void }) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; });
  /* Focus lands on the safe choice when the dialog opens; Escape always closes. */
  useEffect(() => {
    if (!spec) return;
    const opener = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeRef.current(); };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      if (opener && document.contains(opener)) opener.focus();
    };
  }, [spec]);
  if (!spec) return null;
  return (
    <div className="scrim">
      <div role="dialog" aria-modal="true" aria-labelledby="dialog-title" className="dialog">
        <h2 id="dialog-title" className="dialog__title">{spec.title}</h2>
        <p className="dialog__body">{spec.body}</p>
        <div className="dialog__actions">
          <button ref={cancelRef} type="button" className="btn btn--ghost btn--md" onClick={onClose}>{spec.cancel}</button>
          <button type="button" className="btn btn--danger btn--md" onClick={spec.onConfirm}>{spec.action}</button>
        </div>
      </div>
    </div>
  );
}
