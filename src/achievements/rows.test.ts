import { describe, expect, it } from 'vitest';
import { ACHIEVEMENTS } from '../domain';
import { session } from '../domain/testing/builders';
import { achievementRows } from './rows';

describe('achievementRows', () => {
  it('lists every Achievement as locked at first', () => {
    const rows = achievementRows([], '2026-10-10');
    expect(rows).toHaveLength(ACHIEVEMENTS.length);
    expect(rows.every((r) => r.earnedOn === null)).toBe(true);
  });

  it('puts earned Achievements first, most recent first', () => {
    const events = ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05', '2026-10-06', '2026-10-07'].map((d) => session(d));
    const rows = achievementRows(events, '2026-10-07');
    expect(rows.slice(0, 2).map((r) => [r.def.id, r.earnedOn])).toEqual([
      ['streak-7', '2026-10-07'],
      ['streak-3', '2026-10-03'],
    ]);
    expect(rows[2].earnedOn).toBeNull();
    expect(rows).toHaveLength(ACHIEVEMENTS.length);
  });
});
