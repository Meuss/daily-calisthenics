import { describe, expect, it } from 'vitest';
import { calendarWeeks } from './calendar';

describe('calendarWeeks', () => {
  const days = [
    { date: '2026-10-07', status: 'completed' as const, streak: 1 },
    { date: '2026-10-08', status: 'frozen' as const, streak: 1 },
    { date: '2026-10-09', status: 'missed' as const, streak: 0 },
    { date: '2026-10-10', status: 'pending' as const, streak: 0 },
  ];

  it('lays out whole Monday-first weeks ending with the current week', () => {
    const weeks = calendarWeeks(days, '2026-10-10', 5);
    expect(weeks).toHaveLength(5);
    for (const week of weeks) expect(week).toHaveLength(7);
    expect(weeks[0][0].date).toBe('2026-09-07');
    expect(weeks[4][0].date).toBe('2026-10-05');
    expect(weeks[4][6].date).toBe('2026-10-11');
  });

  it('colours known days, leaves earlier ones blank and later ones empty', () => {
    const lastWeek = calendarWeeks(days, '2026-10-10', 5)[4];
    expect(lastWeek.map((c) => c.status)).toEqual(['none', 'none', 'completed', 'frozen', 'missed', 'pending', 'future']);
  });
});
