import { addDays, isMonday, mondayOf, type LocalDate } from './dates';
import type { DomainEvent, EventOf } from './events';
import { DEFAULT_SETTINGS, type FreezePolicy } from './settings';

export type DayStatus = 'completed' | 'frozen' | 'missed' | 'pending';
export type DayRecord = { date: LocalDate; status: DayStatus; streak: number };
export type StreakSummary = {
  current: number;
  best: number;
  freezesAvailable: number;
  days: DayRecord[];
  resets: LocalDate[];
};

function grant(policy: FreezePolicy, banked: number): number {
  return policy.enabled ? Math.min(policy.maxBanked, banked + policy.perWeek) : 0;
}

/** Freeze settings are snapshotted per week: changes apply from the next Monday (or immediately on the first day). */
function policyFor(policies: EventOf<'freezePolicySet'>[], date: LocalDate, firstDay: LocalDate): FreezePolicy {
  const monday = mondayOf(date);
  const cutoff = monday < firstDay ? firstDay : monday;
  let policy = DEFAULT_SETTINGS.freeze;
  for (const event of policies) if (event.date <= cutoff) policy = event.policy;
  return policy;
}

export function computeStreak(events: DomainEvent[], today: LocalDate): StreakSummary {
  const completedDays = new Set<LocalDate>();
  const policies: EventOf<'freezePolicySet'>[] = [];
  let firstDay: LocalDate | undefined;

  for (const event of events) {
    if (event.type === 'sessionFinished') completedDays.add(event.date);
    if (event.type === 'freezePolicySet') policies.push(event);
    if ((event.type === 'sessionFinished' || event.type === 'placementCompleted') && (firstDay === undefined || event.date < firstDay)) {
      firstDay = event.date;
    }
  }

  if (firstDay === undefined || firstDay > today) {
    return { current: 0, best: 0, freezesAvailable: grant(policyFor(policies, today, today), 0), days: [], resets: [] };
  }

  let current = 0;
  let best = 0;
  let freezes = 0;
  const days: DayRecord[] = [];
  const resets: LocalDate[] = [];

  for (let date = firstDay; date <= today; date = addDays(date, 1)) {
    if (date === firstDay || isMonday(date)) freezes = grant(policyFor(policies, date, firstDay), freezes);

    if (completedDays.has(date)) {
      current += 1;
      best = Math.max(best, current);
      days.push({ date, status: 'completed', streak: current });
    } else if (date === today) {
      days.push({ date, status: 'pending', streak: current });
    } else if (current > 0 && freezes > 0) {
      freezes -= 1;
      days.push({ date, status: 'frozen', streak: current });
    } else {
      if (current > 0) resets.push(date);
      current = 0;
      days.push({ date, status: 'missed', streak: 0 });
    }
  }

  return { current, best, freezesAvailable: freezes, days, resets };
}
