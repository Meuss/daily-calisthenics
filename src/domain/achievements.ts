import { EXERCISES } from './catalog/exercises';
import { PROGRESSIONS, exerciseFor } from './catalog/progressions';
import { addDays, type LocalDate } from './dates';
import type { DomainEvent } from './events';
import { computeStreak } from './streak';

export type AchievementDef = { id: string; title: string; description: string };
export type EarnedAchievement = { id: string; earnedOn: LocalDate };

const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100];
const SESSION_MILESTONES = [10, 50, 100, 250];
const WEIGH_IN_MILESTONES = [7, 30];

export const ACHIEVEMENTS: AchievementDef[] = [
  ...STREAK_MILESTONES.map((n) => ({ id: `streak-${n}`, title: `${n}-day Streak`, description: `Complete ${n} days in a row.` })),
  ...SESSION_MILESTONES.map((n) => ({ id: `sessions-${n}`, title: `${n} Sessions`, description: `Finish ${n} Sessions in total.` })),
  ...WEIGH_IN_MILESTONES.map((n) => ({ id: `weighins-${n}`, title: `${n} Weigh-ins in a row`, description: `Log a Weigh-in ${n} days in a row.` })),
  { id: 'comeback', title: 'Comeback', description: 'Start a new Streak after losing one.' },
  ...Object.values(PROGRESSIONS).flatMap((progression) =>
    progression.steps.slice(1).map((exerciseId) => ({
      id: `unlock:${exerciseId}`,
      title: `Unlocked: ${EXERCISES[exerciseId].name}`,
      description: `Reach ${EXERCISES[exerciseId].name} in the ${progression.name} Progression.`,
    })),
  ),
];

/** Derived from the event log, so the list always reflects what actually happened (ADR 0001). */
export function earnedAchievements(events: DomainEvent[], today: LocalDate): EarnedAchievement[] {
  const earned = new Map<string, LocalDate>();
  const earn = (id: string, date: LocalDate) => {
    if (!earned.has(id)) earned.set(id, date);
  };

  const streak = computeStreak(events, today);
  for (const day of streak.days) {
    if (day.status !== 'completed') continue;
    for (const n of STREAK_MILESTONES) if (day.streak >= n) earn(`streak-${n}`, day.date);
  }

  const firstReset = streak.resets[0];
  if (firstReset !== undefined) {
    const comeback = streak.days.find((day) => day.date > firstReset && day.status === 'completed');
    if (comeback) earn('comeback', comeback.date);
  }

  let sessions = 0;
  for (const event of events) {
    if (event.type === 'sessionFinished') {
      sessions += 1;
      for (const n of SESSION_MILESTONES) if (sessions === n) earn(`sessions-${n}`, event.date);
    }
    if (event.type === 'adjustmentAccepted' && event.to.step > event.from.step) {
      earn(`unlock:${exerciseFor(event.progression, event.to.step).id}`, event.date);
    }
  }

  // Achievements are one-off: a run counts every day a Weigh-in was ever recorded, so a later deletion can't revoke it.
  const weighInDays = [...new Set(events.flatMap((e) => (e.type === 'weighInRecorded' ? [e.date] : [])))].sort();
  let run = 0;
  let previous: LocalDate | undefined;
  for (const date of weighInDays) {
    run = previous !== undefined && addDays(previous, 1) === date ? run + 1 : 1;
    previous = date;
    for (const n of WEIGH_IN_MILESTONES) if (run >= n) earn(`weighins-${n}`, date);
  }

  return [...earned]
    .map(([id, earnedOn]) => ({ id, earnedOn }))
    .sort((a, b) => (a.earnedOn < b.earnedOn ? -1 : a.earnedOn > b.earnedOn ? 1 : 0));
}

export function newlyEarned(before: EarnedAchievement[], after: EarnedAchievement[]): EarnedAchievement[] {
  const seen = new Set(before.map((a) => a.id));
  return after.filter((a) => !seen.has(a.id));
}
