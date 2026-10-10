import { describe, expect, it } from 'vitest';
import { weighIn, weighInDeleted } from './testing/builders';
import { deriveWeighIns, movingAverage7, roundKg, validateWeighIn } from './weighins';

describe('deriveWeighIns', () => {
  it('keeps the latest entry for a day', () => {
    expect(deriveWeighIns([weighIn('2026-10-05', 82), weighIn('2026-10-05', 81.6)])).toEqual([{ date: '2026-10-05', kg: 81.6 }]);
  });

  it('removes a deleted day and allows re-entering it', () => {
    expect(deriveWeighIns([weighIn('2026-10-05', 82), weighInDeleted('2026-10-05')])).toEqual([]);
    expect(deriveWeighIns([weighIn('2026-10-05', 82), weighInDeleted('2026-10-05'), weighIn('2026-10-05', 81)])).toEqual([
      { date: '2026-10-05', kg: 81 },
    ]);
  });

  it('sorts backfilled entries by day', () => {
    const events = [weighIn('2026-10-07', 81), weighIn('2026-10-05', 82, '2026-10-07')];
    expect(deriveWeighIns(events).map((w) => w.date)).toEqual(['2026-10-05', '2026-10-07']);
  });
});

describe('movingAverage7', () => {
  it('averages the Weigh-ins of the 7 days ending on each point, across gaps', () => {
    const points = movingAverage7([
      { date: '2026-10-01', kg: 80 },
      { date: '2026-10-03', kg: 82 },
      { date: '2026-10-08', kg: 84 },
    ]);
    expect(points).toEqual([
      { date: '2026-10-01', kg: 80 },
      { date: '2026-10-03', kg: 81 },
      { date: '2026-10-08', kg: 83 }, // window 2–8 Oct: 82 and 84
    ]);
  });
});

describe('validateWeighIn', () => {
  const today = '2026-10-10';

  it('accepts today and past days', () => {
    expect(validateWeighIn(today, 81.4, today)).toBeNull();
    expect(validateWeighIn('2026-09-01', 81.4, today)).toBeNull();
  });

  it('rejects a future day', () => {
    expect(validateWeighIn('2026-10-11', 81.4, today)).toBe('A Weigh-in cannot be in the future.');
  });

  it('rejects impossible weights', () => {
    for (const kg of [19.9, 400.1, Number.NaN]) {
      expect(validateWeighIn(today, kg, today)).toBe('Weight must be between 20 and 400 kg.');
    }
  });
});

describe('roundKg', () => {
  it('rounds to one decimal', () => {
    expect(roundKg(80.456)).toBe(80.5);
  });
});
