import { ShieldOff } from 'lucide-react';
import { BackButton, Button, Icon } from './ui';

/* A record this facility holds no consent for. The attempt itself is audited. */
export function AccessDenied({ facility, backLabel, onBack, patient }: {
  facility: string; backLabel: string; onBack: () => void;
  /** Whose record was refused, when the refusal came from opening one. */
  patient?: string;
}) {
  return (
    <div className="denied">
      <BackButton onClick={onBack}>{backLabel}</BackButton>
      <div className="callout callout--clay">
        <span className="callout__icon"><Icon icon={ShieldOff} /></span>
        <div className="callout__body">
          <h1 className="callout__title denied__title">Access denied</h1>
          <p>{patient ?? 'This patient'} has not granted {facility} permission to view this record, or the permission has been withdrawn.</p>
          <p className="muted">This access attempt has been recorded in the audit log.</p>
          <Button variant="outline" className="self-start denied__back" onClick={onBack}>Back to queue</Button>
        </div>
      </div>
    </div>
  );
}
