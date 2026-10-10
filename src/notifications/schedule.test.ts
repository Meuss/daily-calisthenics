import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../domain';
import { reminderPlan } from './schedule';

const reminder = DEFAULT_SETTINGS.reminder; // 07:30, nudge 09:00

describe('reminderPlan', () => {
  it('schedules the daily Reminder and a nudge for each of the next 7 days', () => {
    const plan = reminderPlan(reminder, false, new Date(2026, 9, 10, 7, 0));
    expect(plan[0]).toMatchObject({ id: 'daily-reminder', kind: 'daily', hour: 7, minute: 30 });
    const nudges = plan.slice(1);
    expect(nudges).toHaveLength(7);
    expect(nudges[0]).toMatchObject({ id: 'nudge-2026-10-10', kind: 'date' });
    expect(nudges[0].kind === 'date' && nudges[0].date).toEqual(new Date(2026, 9, 10, 9, 0));
    expect(nudges[6].id).toBe('nudge-2026-10-16');
  });

  it("drops today's nudge once today's Session is done", () => {
    const plan = reminderPlan(reminder, true, new Date(2026, 9, 10, 7, 45));
    expect(plan.map((r) => r.id)).not.toContain('nudge-2026-10-10');
    expect(plan.filter((r) => r.kind === 'date')).toHaveLength(6);
  });

  it("drops today's nudge once its time has passed", () => {
    const plan = reminderPlan(reminder, false, new Date(2026, 9, 10, 9, 30));
    expect(plan.map((r) => r.id)).not.toContain('nudge-2026-10-10');
  });

  it('honours the on/off switches', () => {
    expect(reminderPlan({ ...reminder, enabled: false, nudgeEnabled: false }, false, new Date(2026, 9, 10, 7, 0))).toEqual([]);
    const onlyNudges = reminderPlan({ ...reminder, enabled: false }, false, new Date(2026, 9, 10, 7, 0));
    expect(onlyNudges.every((r) => r.kind === 'date')).toBe(true);
  });
});
