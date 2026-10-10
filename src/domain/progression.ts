import { defaultLevels } from './catalog/progressions';
import type { DomainEvent } from './events';
import type { Levels } from './primitives';

/** The user's current Progression Step and Target for every Progression. The latest Placement or accepted Adjustment wins. */
export function deriveLevels(events: DomainEvent[]): Levels {
  let levels = defaultLevels();
  for (const event of events) {
    if (event.type === 'placementCompleted') levels = { ...event.levels };
    if (event.type === 'adjustmentAccepted') levels = { ...levels, [event.progression]: event.to };
  }
  return levels;
}
