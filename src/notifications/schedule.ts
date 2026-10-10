import { toLocalDate, type ReminderSettings } from '../domain';
import { toMinutes } from '../ui/format';

export type ScheduledReminder = { id: string; title: string; body: string } & (
  | { kind: 'daily'; hour: number; minute: number }
  | { kind: 'date'; date: Date }
);

export const NUDGE_DAYS = 7;

export function reminderPlan(reminder: ReminderSettings, doneToday: boolean, now: Date): ScheduledReminder[] {
  const plan: ScheduledReminder[] = [];

  if (reminder.enabled) {
    const minutes = toMinutes(reminder.time);
    plan.push({
      id: 'daily-reminder',
      kind: 'daily',
      hour: Math.floor(minutes / 60),
      minute: minutes % 60,
      title: 'Time to move',
      body: 'Your 12-minute Routine is ready.',
    });
  }

  if (reminder.nudgeEnabled) {
    const minutes = toMinutes(reminder.nudgeTime);
    for (let offset = 0; offset < NUDGE_DAYS; offset++) {
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, Math.floor(minutes / 60), minutes % 60);
      if (offset === 0 && (doneToday || date <= now)) continue;
      plan.push({
        id: `nudge-${toLocalDate(date)}`,
        kind: 'date',
        date,
        title: 'Still time today',
        body: 'Even the Short Routine keeps your Streak alive.',
      });
    }
  }

  return plan;
}
