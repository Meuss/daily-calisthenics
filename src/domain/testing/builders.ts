import { defaultLevels } from '../catalog/progressions';
import type { LocalDate } from '../dates';
import type { EventOf } from '../events';
import type { Levels, ProgressionId, ProgressionLevel, Rating, RotationRoutineId, RoutineId } from '../primitives';
import { DEFAULT_SETTINGS, type FreezePolicy } from '../settings';

/** Test-only helpers. Every event is recorded at 07:00 UTC on `recordedOn` (defaults to its `date`). */
const at = (date: LocalDate) => `${date}T07:00:00.000Z`;

export const session = (date: LocalDate, routineId: RoutineId = 'A', skipped: ProgressionId[] = []): EventOf<'sessionFinished'> => ({
  type: 'sessionFinished', at: at(date), date, routineId, skipped,
});

export const rating = (date: LocalDate, progression: ProgressionId, value: Rating, exerciseId = 'any'): EventOf<'ratingGiven'> => ({
  type: 'ratingGiven', at: at(date), date, progression, exerciseId, rating: value,
});

export const weighIn = (date: LocalDate, kg: number, recordedOn: LocalDate = date): EventOf<'weighInRecorded'> => ({
  type: 'weighInRecorded', at: at(recordedOn), date, kg,
});

export const weighInDeleted = (date: LocalDate): EventOf<'weighInDeleted'> => ({
  type: 'weighInDeleted', at: at(date), date,
});

export const placement = (date: LocalDate, levels: Levels = defaultLevels(), rotationStart: RotationRoutineId = 'A'): EventOf<'placementCompleted'> => ({
  type: 'placementCompleted', at: at(date), date, levels, rotationStart,
});

export const accepted = (date: LocalDate, progression: ProgressionId, from: ProgressionLevel, to: ProgressionLevel): EventOf<'adjustmentAccepted'> => ({
  type: 'adjustmentAccepted', at: at(date), date, progression, from, to,
});

export const dismissed = (date: LocalDate, progression: ProgressionId): EventOf<'adjustmentDismissed'> => ({
  type: 'adjustmentDismissed', at: at(date), date, progression,
});

export const freezePolicy = (date: LocalDate, policy: Partial<FreezePolicy>): EventOf<'freezePolicySet'> => ({
  type: 'freezePolicySet', at: at(date), date, policy: { ...DEFAULT_SETTINGS.freeze, ...policy },
});
