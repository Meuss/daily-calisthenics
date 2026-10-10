import { describe, expect, it } from 'vitest';
import { ACHIEVEMENTS, earnedAchievements, newlyEarned } from './achievements';
import { eachDay } from './dates';
import { accepted, freezePolicy, placement, session, weighIn } from './testing/builders';

// Freezes off, so misses reset the Streak immediately and tests stay readable.
const noFreezes = (date: string) => freezePolicy(date, { enabled: false });
const ids = (earned: { id: string }[]) => earned.map((a) => a.id);
const earnedOn = (earned: { id: string; earnedOn: string }[], id: string) => earned.find((a) => a.id === id)?.earnedOn;

describe('earnedAchievements', () => {
  it('awards a Streak milestone on the day it is reached', () => {
    const events = [noFreezes('2026-10-01'), ...eachDay('2026-10-01', '2026-10-03').map((d) => session(d))];
    const earned = earnedAchievements(events, '2026-10-03');
    expect(earnedOn(earned, 'streak-3')).toBe('2026-10-03');
    expect(ids(earned)).not.toContain('streak-7');
  });

  it('awards a Streak milestone once, at its first occurrence', () => {
    const events = [
      noFreezes('2026-10-01'),
      ...eachDay('2026-10-01', '2026-10-03').map((d) => session(d)),
      ...eachDay('2026-10-05', '2026-10-07').map((d) => session(d)),
    ];
    const earned = earnedAchievements(events, '2026-10-07');
    expect(ids(earned).filter((id) => id === 'streak-3')).toHaveLength(1);
    expect(earnedOn(earned, 'streak-3')).toBe('2026-10-03');
  });

  it('counts every Session toward volume, including two on one day', () => {
    const events = eachDay('2026-10-01', '2026-10-05').flatMap((d) => [session(d, 'short'), session(d, 'A')]);
    expect(earnedOn(earnedAchievements(events, '2026-10-05'), 'sessions-10')).toBe('2026-10-05');
  });

  it('awards Weigh-ins in a row, including backfilled ones, and a gap breaks the run', () => {
    const run = eachDay('2026-10-01', '2026-10-07').map((d) => weighIn(d, 80, '2026-10-07'));
    expect(earnedOn(earnedAchievements(run, '2026-10-07'), 'weighins-7')).toBe('2026-10-07');

    const withGap = [...eachDay('2026-10-01', '2026-10-03'), ...eachDay('2026-10-05', '2026-10-08')].map((d) => weighIn(d, 80));
    expect(ids(earnedAchievements(withGap, '2026-10-08'))).not.toContain('weighins-7');
  });

  it('awards Comeback on the first Completed Day after a reset', () => {
    const events = [noFreezes('2026-10-01'), session('2026-10-01'), session('2026-10-02'), session('2026-10-05')];
    expect(earnedOn(earnedAchievements(events, '2026-10-05'), 'comeback')).toBe('2026-10-05');
    expect(ids(earnedAchievements([session('2026-10-01')], '2026-10-01'))).not.toContain('comeback');
  });

  it('awards an unlock when an accepted Adjustment reaches a new step', () => {
    const events = [placement('2026-10-01'), accepted('2026-10-04', 'push', { step: 2, target: 12 }, { step: 3, target: 5 })];
    expect(earnedOn(earnedAchievements(events, '2026-10-04'), 'unlock:push-up')).toBe('2026-10-04');
  });

  it('does not award unlocks for Placement, target changes or going down', () => {
    const events = [
      placement('2026-10-01', undefined),
      accepted('2026-10-02', 'push', { step: 0, target: 10 }, { step: 0, target: 12 }),
      accepted('2026-10-03', 'squat', { step: 1, target: 4 }, { step: 0, target: 10 }),
    ];
    expect(ids(earnedAchievements(events, '2026-10-03')).filter((id) => id.startsWith('unlock:'))).toEqual([]);
  });

  it('only ever returns known Achievements', () => {
    const known = new Set(ACHIEVEMENTS.map((a) => a.id));
    const events = [
      ...eachDay('2026-09-01', '2026-10-05').flatMap((d) => [session(d), weighIn(d, 80)]),
      accepted('2026-10-05', 'back', { step: 0, target: 12 }, { step: 1, target: 15 }),
    ];
    for (const id of ids(earnedAchievements(events, '2026-10-05'))) expect(known.has(id)).toBe(true);
  });
});

describe('newlyEarned', () => {
  it('returns Achievements present after but not before', () => {
    const before = [{ id: 'streak-3', earnedOn: '2026-10-03' }];
    const after = [...before, { id: 'sessions-10', earnedOn: '2026-10-05' }];
    expect(newlyEarned(before, after)).toEqual([{ id: 'sessions-10', earnedOn: '2026-10-05' }]);
  });
});
