import type { ExerciseMode } from './catalog/exercises';
import { exerciseFor, lastStep } from './catalog/progressions';
import type { DomainEvent } from './events';
import type { ProgressionId, ProgressionLevel, Rating } from './primitives';
import { deriveLevels } from './progression';
import type { AdjustmentRules } from './settings';

export type Direction = 'up' | 'down';

export type Adjustment = {
  progression: ProgressionId;
  direction: Direction;
  from: ProgressionLevel;
  to: ProgressionLevel;
};

function limits(mode: ExerciseMode, rules: AdjustmentRules) {
  return mode === 'reps'
    ? { increment: rules.repIncrement, ceiling: rules.repCeiling, floor: rules.repFloor }
    : { increment: rules.holdIncrement, ceiling: rules.holdCeiling, floor: rules.holdFloor };
}

export function nextLevel(
  progression: ProgressionId,
  level: ProgressionLevel,
  direction: Direction,
  rules: AdjustmentRules,
): ProgressionLevel | null {
  const { increment, ceiling, floor } = limits(exerciseFor(progression, level.step).mode, rules);

  if (direction === 'up') {
    if (level.target >= ceiling && level.step < lastStep(progression)) {
      return { step: level.step + 1, target: exerciseFor(progression, level.step + 1).startTarget };
    }
    return { step: level.step, target: level.target + increment };
  }

  if (level.target - increment >= floor) return { step: level.step, target: level.target - increment };
  if (level.step > 0) {
    const previous = limits(exerciseFor(progression, level.step - 1).mode, rules);
    return { step: level.step - 1, target: previous.ceiling - previous.increment };
  }
  if (level.target > floor) return { step: level.step, target: floor };
  return null;
}

/** Adjustments to propose now, from the Ratings since each Progression's last Placement or Adjustment decision. */
export function pendingAdjustments(events: DomainEvent[], rules: AdjustmentRules): Adjustment[] {
  if (!rules.enabled) return [];

  const recent = new Map<ProgressionId, Rating[]>();
  for (const event of events) {
    if (event.type === 'placementCompleted') recent.clear();
    if (event.type === 'adjustmentAccepted' || event.type === 'adjustmentDismissed') recent.delete(event.progression);
    if (event.type === 'ratingGiven') recent.set(event.progression, [...(recent.get(event.progression) ?? []), event.rating]);
  }

  const levels = deriveLevels(events);
  const adjustments: Adjustment[] = [];
  for (const [progression, ratings] of recent) {
    const lastRatings = ratings.slice(-rules.ratingsInARow);
    if (lastRatings.length < rules.ratingsInARow) continue;

    const direction: Direction | null = lastRatings.every((r) => r === 'tooEasy')
      ? 'up'
      : lastRatings.every((r) => r === 'tooHard')
        ? 'down'
        : null;
    if (!direction) continue;

    const from = levels[progression];
    const to = nextLevel(progression, from, direction, rules);
    if (to) adjustments.push({ progression, direction, from, to });
  }
  return adjustments;
}
