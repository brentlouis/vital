import { useMemo } from 'react';
import { useDemo } from '../store/context';
import { UNSEEN_FROM, noticesFor, seenKey } from '../domain/notify';
import { NotificationBell } from './NotificationBell';

/* What reaches one facility, read live from the shared store. */
export function FacilityBell({ facility, onOpen }: { facility: string; onOpen: (id: string) => void }) {
  const { state, now, markSeen, staffViewer } = useDemo();
  const viewer = staffViewer(facility);
  const notices = useMemo(() => noticesFor(viewer, state.appointments, now), [viewer, state.appointments, now]);
  const key = seenKey(viewer);
  return (
    <NotificationBell notices={notices} seenAt={state.seen[key] ?? UNSEEN_FROM} now={now}
      onOpen={onOpen} onSeen={() => markSeen(key)} />
  );
}
