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
});
