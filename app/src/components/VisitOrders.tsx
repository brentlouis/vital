import { FlaskConical } from 'lucide-react';
import { Button, Card, StatusBadge } from './ui';
import type { Appointment } from '../domain/view';

/* On a doctor visit: the tests the doctor ordered from it, and the button that orders more.
   Ordering opens the referral form with this patient and this visit filled in. */
export function VisitOrders({ visit, ordered, canOrder, onOrder, onOpen }: {
  visit: Appointment;
  ordered: Appointment[];
  canOrder: boolean;
  onOrder: () => void;
  onOpen?: (id: string) => void;
}) {
  const seen = visit.status === 'Patient arrived' || visit.status === 'Completed';
  if (!seen && !ordered.length) return null;
  return (
    <Card title="Tests from this visit">
      {ordered.length ? (
        <ul className="visit-orders">
          {ordered.map(r => (
            <li key={r.id}>
              <button type="button" className="row-link" onClick={() => onOpen?.(r.id)}>{r.test}</button>
              <span className="muted small">{r.lab} · <span className="tabular">{r.scheduledAt}</span></span>
              <StatusBadge status={r.status} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted small m0">No tests ordered from this visit.</p>
      )}
      {canOrder && seen && (
        <div className="visit-orders__act">
          <Button size="md" variant="outline" icon={FlaskConical} onClick={onOrder}>Order tests from this visit</Button>
          <span className="actions__hint">Opens a new appointment with {visit.patient} filled in. The patient sees it under this visit.</span>
        </div>
      )}
    </Card>
  );
}
