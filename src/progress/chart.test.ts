import { describe, expect, it } from 'vitest';
import { chartGeometry } from './chart';

describe('chartGeometry', () => {
  it('returns nothing without Weigh-ins in the window', () => {
    expect(chartGeometry([], '2026-10-10', 60, 300, 160)).toBeNull();
    expect(chartGeometry([{ date: '2026-01-01', kg: 80 }], '2026-10-10', 60, 300, 160)).toBeNull();
  });

  it('puts today at the right edge and the first day of the window at the left', () => {
    const geometry = chartGeometry(
      [{ date: '2026-08-12', kg: 82 }, { date: '2026-10-10', kg: 80 }],
      '2026-10-10', 60, 300, 160, 16,
    );
    expect(geometry?.raw.map((p) => p.x)).toEqual([16, 284]);
  });

  it('draws heavier Weigh-ins higher, with half a kilo of margin', () => {
    const geometry = chartGeometry(
      [{ date: '2026-10-09', kg: 82 }, { date: '2026-10-10', kg: 80 }],
      '2026-10-10', 60, 300, 160, 16,
    );
    expect(geometry?.minKg).toBe(79.5);
    expect(geometry?.maxKg).toBe(82.5);
    const [heavier, lighter] = geometry?.raw ?? [];
    expect(heavier.y).toBeLessThan(lighter.y);
  });

  it('draws the 7-day average as one point per Weigh-in', () => {
    const geometry = chartGeometry(
      [{ date: '2026-10-08', kg: 80 }, { date: '2026-10-09', kg: 81 }, { date: '2026-10-10', kg: 82 }],
      '2026-10-10', 60, 300, 160,
    );
    expect(geometry?.average.split(' ')).toHaveLength(3);
  });

  it('shrinks the window to fit recent data, but never below 14 days', () => {
    const geometry = chartGeometry(
      [{ date: '2026-10-08', kg: 82 }, { date: '2026-10-10', kg: 81 }],
      '2026-10-10', 60, 300, 160, 16,
    );
    // 14-day window 27 Sep–10 Oct: 8 Oct is 11 of 13 steps in
    expect(geometry?.raw.map((p) => Math.round(p.x))).toEqual([Math.round(16 + (11 / 13) * 268), 284]);
  });

  it('starts the window at the first Weigh-in when that is within the maximum', () => {
    const geometry = chartGeometry(
      [{ date: '2026-09-20', kg: 82 }, { date: '2026-10-10', kg: 81 }],
      '2026-10-10', 60, 300, 160, 16,
    );
    expect(geometry?.raw.map((p) => p.x)).toEqual([16, 284]);
  });
});
