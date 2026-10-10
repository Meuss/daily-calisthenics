import { ROTATION, SHORT_ROUTINE_ID } from './catalog/routines';
import type { DomainEvent } from './events';
import type { RotationRoutineId } from './primitives';

/** The Routine to offer next: the Rotation advances only when a full Routine is finished. */
export function nextRoutineId(events: DomainEvent[]): RotationRoutineId {
  let start: RotationRoutineId = ROTATION[0];
  let finished = 0;
  for (const event of events) {
    if (event.type === 'placementCompleted') {
      start = event.rotationStart;
      finished = 0;
    }
    if (event.type === 'sessionFinished' && event.routineId !== SHORT_ROUTINE_ID) finished += 1;
  }
  return ROTATION[(ROTATION.indexOf(start) + finished) % ROTATION.length];
}
