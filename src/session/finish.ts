import {
  ACHIEVEMENTS,
  computeStreak,
  earnedAchievements,
  exerciseFor,
  newlyEarned,
  pendingAdjustments,
  toLocalDate,
  type AchievementDef,
  type Adjustment,
  type AppSettings,
  type DomainEvent,
  type ProgressionId,
  type Rating,
} from '../domain';
import { formatTarget } from '../ui/format';
import { ratableExercises, skippedProgressions, type PlayerState } from './player';

/** A Session counts for the day it is finished on; written as soon as the end is reached. */
export function sessionFinishedEvent(state: PlayerState, now: Date): DomainEvent {
  return { type: 'sessionFinished', at: now.toISOString(), date: toLocalDate(now), routineId: state.routineId, skipped: skippedProgressions(state) };
}

/** One Rating per rated Exercise, defaulting to ok. */
export function ratingEvents(state: PlayerState, ratings: Partial<Record<ProgressionId, Rating>>, now: Date): DomainEvent[] {
  const at = now.toISOString();
  const date = toLocalDate(now);
  return ratableExercises(state).map(({ progression, exerciseId }): DomainEvent => ({
    type: 'ratingGiven',
    at,
    date,
    progression,
    exerciseId,
    rating: ratings[progression] ?? 'ok',
  }));
}

export type SessionOutcome = { streak: number; newAchievements: AchievementDef[]; adjustments: Adjustment[] };

export function sessionOutcome(before: DomainEvent[], added: DomainEvent[], settings: AppSettings, now: Date): SessionOutcome {
  const today = toLocalDate(now);
  const after = [...before, ...added];
  const fresh = new Set(newlyEarned(earnedAchievements(before, today), earnedAchievements(after, today)).map((a) => a.id));
  return {
    streak: computeStreak(after, today).current,
    newAchievements: ACHIEVEMENTS.filter((a) => fresh.has(a.id)),
    adjustments: pendingAdjustments(after, settings.adjustments),
  };
}

export function describeAdjustment({ progression, direction, from, to }: Adjustment): string {
  const target = exerciseFor(progression, to.step);
  const amount = formatTarget(target.mode, to.target);
  if (to.step !== from.step) return `${direction === 'up' ? 'Level up' : 'Step back'}: ${target.name} × ${amount}`;
  return `${target.name}: ${formatTarget(target.mode, from.target)} → ${amount}`;
}
