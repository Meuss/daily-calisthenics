import { describe, expect, it } from 'vitest';
import { eachDay } from './dates';
import { computeStreak } from './streak';
import { freezePolicy, placement, session, weighIn } from './testing/builders';

const statusOn = (summary: ReturnType<typeof computeStreak>, date: string) => summary.days.find((d) => d.date === date)?.status;

describe('computeStreak', () => {
  it('is empty before the first Session, with this week\'s Freeze ready', () => {
    expect(computeStreak([], '2026-10-10')).toEqual({ current: 0, best: 0, freezesAvailable: 1, days: [], resets: [] });
  });

  it('counts consecutive Completed Days', () => {
    const events = eachDay('2026-10-05', '2026-10-07').map((d) => session(d));
    expect(computeStreak(events, '2026-10-07')).toMatchObject({ current: 3, best: 3 });
  });

  it('keeps the Streak while today is still pending', () => {
    const summary = computeStreak([session('2026-10-05'), session('2026-10-06')], '2026-10-07');
    expect(summary.current).toBe(2);
    expect(statusOn(summary, '2026-10-07')).toBe('pending');
  });

  it('counts a day with two Sessions once', () => {
    const events = [session('2026-10-05', 'short'), session('2026-10-05', 'A')];
    expect(computeStreak(events, '2026-10-05').current).toBe(1);
  });

  it('uses a Freeze for a missed day; the frozen day keeps but does not grow the Streak', () => {
    const events = [session('2026-10-05'), session('2026-10-06'), session('2026-10-08')];
    const summary = computeStreak(events, '2026-10-08');
    expect(statusOn(summary, '2026-10-07')).toBe('frozen');
    expect(summary.current).toBe(3);
    expect(summary.freezesAvailable).toBe(0);
  });

  it('resets when a day is missed with no Freeze left', () => {
    const events = [session('2026-10-05'), session('2026-10-06'), session('2026-10-09')];
    const summary = computeStreak(events, '2026-10-09');
    expect(statusOn(summary, '2026-10-07')).toBe('frozen');
    expect(statusOn(summary, '2026-10-08')).toBe('missed');
    expect(summary).toMatchObject({ current: 1, best: 2, resets: ['2026-10-08'] });
  });

  it('does not burn Freezes while there is no Streak to protect', () => {
    // Mon 28 Sep: Session. 29: frozen. 30: reset. Then nothing. Mon 5 Oct grants a Freeze that must stay unused.
    const summary = computeStreak([session('2026-09-28')], '2026-10-06');
    expect(statusOn(summary, '2026-09-29')).toBe('frozen');
    expect(statusOn(summary, '2026-10-05')).toBe('missed');
    expect(summary.freezesAvailable).toBe(1);
    expect(summary.current).toBe(0);
  });

  it('banks Freezes up to the maximum', () => {
    const events = eachDay('2026-09-14', '2026-10-05').map((d) => session(d));
    expect(computeStreak(events, '2026-10-05').freezesAvailable).toBe(2);
  });

  it('applies a mid-week Freeze settings change from the next Monday', () => {
    const events = [
      session('2026-10-05'),
      session('2026-10-06'),
      freezePolicy('2026-10-07', { perWeek: 0 }),
      session('2026-10-07'),
      // 8 Oct missed: still covered by this week's original policy
      session('2026-10-09'),
      session('2026-10-10'),
      session('2026-10-11'),
      session('2026-10-12'),
    ];
    const summary = computeStreak(events, '2026-10-12');
    expect(statusOn(summary, '2026-10-08')).toBe('frozen');
    expect(summary.current).toBe(7);
    expect(summary.freezesAvailable).toBe(0); // Monday 12 Oct granted 0 under the new policy
  });

  it('applies Freeze settings chosen on the very first day immediately', () => {
    const events = [
      placement('2026-10-07'),
      freezePolicy('2026-10-07', { enabled: false }),
      session('2026-10-07'),
      session('2026-10-09'),
    ];
    const summary = computeStreak(events, '2026-10-09');
    expect(statusOn(summary, '2026-10-08')).toBe('missed');
    expect(summary.current).toBe(1);
    expect(summary.freezesAvailable).toBe(0);
  });

  it('ignores backfilled Weigh-ins when deciding where history starts', () => {
    const summary = computeStreak([weighIn('2026-09-01', 80, '2026-10-09'), session('2026-10-09')], '2026-10-09');
    expect(summary.days).toHaveLength(1);
  });

  it('applies a Freeze settings change made on a Monday from the following Monday', () => {
    const events = [
      ...eachDay('2026-10-05', '2026-10-12').map((d) => session(d)),
      freezePolicy('2026-10-12', { enabled: false }),
      session('2026-10-14'),
    ];
    const summary = computeStreak(events, '2026-10-14');
    expect(statusOn(summary, '2026-10-13')).toBe('frozen');
    expect(summary.current).toBe(9);
  });
});
