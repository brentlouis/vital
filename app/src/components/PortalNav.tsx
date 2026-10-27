import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Icon } from './ui';

export interface NavItem<T extends string> {
  id: T;
  label: string;
  icon: LucideIcon;
  /** Work waiting in this place, shown as a count. */
  count?: number;
}

/* The portal's own navigation: the few places staff move between all day. A rail on a
   desktop, a row across the top on a narrow window. */
export function PortalNav<T extends string>({ items, value, onChange, label, footer }: {
  items: NavItem<T>[]; value: T | null; onChange: (id: T) => void; label: string;
  /** Settings that belong to the whole portal, under the links. */
  footer?: ReactNode;
}) {
  return (
    <nav className="pnav" aria-label={label}>
      <ul className="pnav__list">
        {items.map(it => (
          <li key={it.id}>
            <button type="button" className="pnav__item" aria-current={value === it.id ? 'page' : undefined} onClick={() => onChange(it.id)}>
              <Icon icon={it.icon} size={18} />
              <span className="pnav__label">{it.label}</span>
              {it.count !== undefined && it.count > 0 && <span className="pnav__count tabular">{it.count}</span>}
            </button>
          </li>
        ))}
      </ul>
      {footer && <div className="pnav__footer">{footer}</div>}
    </nav>
  );
}
