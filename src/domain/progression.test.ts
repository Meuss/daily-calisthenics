import { describe, expect, it } from 'vitest';
import { defaultLevels } from './catalog/progressions';
import { deriveLevels } from './progression';
import { accepted, placement, session } from './testing/builders';

describe('deriveLevels', () => {
  it('uses default levels before anything happened', () => {
    expect(deriveLevels([])).toEqual(defaultLevels());
  });

  it('takes levels from Placement', () => {
    const levels = { ...defaultLevels(), push: { step: 2, target: 8 } };
    expect(deriveLevels([placement('2026-10-05', levels)]).push).toEqual({ step: 2, target: 8 });
  });

  it('applies an accepted Adjustment to its Progression only', () => {
    const levels = deriveLevels([
      placement('2026-10-05'),
      session('2026-10-05'),
      accepted('2026-10-05', 'push', { step: 0, target: 10 }, { step: 0, target: 12 }),
    ]);
    expect(levels.push).toEqual({ step: 0, target: 12 });
    expect(levels.squat).toEqual(defaultLevels().squat);
  });

  it('lets a redone Placement overwrite earlier Adjustments', () => {
    const levels = deriveLevels([
      accepted('2026-10-05', 'push', { step: 0, target: 10 }, { step: 0, target: 12 }),
      placement('2026-10-06', { ...defaultLevels(), push: { step: 3, target: 6 } }),
    ]);
    expect(levels.push).toEqual({ step: 3, target: 6 });
  });
});
