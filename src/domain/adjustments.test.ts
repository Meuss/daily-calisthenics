import { describe, expect, it } from 'vitest';
import { nextLevel, pendingAdjustments } from './adjustments';
import { defaultLevels } from './catalog/progressions';
import { DEFAULT_SETTINGS } from './settings';
import { accepted, dismissed, placement, rating } from './testing/builders';

const rules = DEFAULT_SETTINGS.adjustments;
const D = '2026-10-05';
// Push at knee push-ups × 8
const start = placement(D, { ...defaultLevels(), push: { step: 2, target: 8 } });

describe('nextLevel', () => {
  it('adds reps when going up below the ceiling', () => {
    expect(nextLevel('push', { step: 2, target: 8 }, 'up', rules)).toEqual({ step: 2, target: 10 });
  });

  it('moves to the next step at its start Target once at the ceiling', () => {
    expect(nextLevel('push', { step: 2, target: 12 }, 'up', rules)).toEqual({ step: 3, target: 5 });
  });

  it('keeps adding reps on the last step', () => {
    expect(nextLevel('push', { step: 5, target: 12 }, 'up', rules)).toEqual({ step: 5, target: 14 });
  });

  it('adds seconds for a Hold', () => {
    expect(nextLevel('coreHold', { step: 1, target: 20 }, 'up', rules)).toEqual({ step: 1, target: 25 });
    expect(nextLevel('hinge', { step: 2, target: 20 }, 'up', rules)).toEqual({ step: 2, target: 25 });
  });

  it('removes reps when going down above the floor', () => {
    expect(nextLevel('push', { step: 2, target: 8 }, 'down', rules)).toEqual({ step: 2, target: 6 });
  });

  it('drops to the previous step just under its ceiling at the floor', () => {
    expect(nextLevel('push', { step: 2, target: 4 }, 'down', rules)).toEqual({ step: 1, target: 10 });
  });

  it('clamps to the floor on the first step, then has nowhere to go', () => {
    expect(nextLevel('push', { step: 0, target: 5 }, 'down', rules)).toEqual({ step: 0, target: 4 });
    expect(nextLevel('push', { step: 0, target: 4 }, 'down', rules)).toBeNull();
  });
});

describe('pendingAdjustments', () => {
  it('suggests going up after 2 "too easy" Ratings in a row', () => {
    const events = [start, rating(D, 'push', 'tooEasy'), rating('2026-10-06', 'push', 'tooEasy')];
    expect(pendingAdjustments(events, rules)).toEqual([
      { progression: 'push', direction: 'up', from: { step: 2, target: 8 }, to: { step: 2, target: 10 } },
    ]);
  });

  it('suggests going down after 2 "too hard" Ratings in a row', () => {
    const events = [start, rating(D, 'push', 'tooHard'), rating('2026-10-06', 'push', 'tooHard')];
    expect(pendingAdjustments(events, rules)[0]).toMatchObject({ direction: 'down', to: { step: 2, target: 6 } });
  });

  it('needs the Ratings to be consecutive', () => {
    expect(pendingAdjustments([start, rating(D, 'push', 'tooEasy')], rules)).toEqual([]);
    expect(pendingAdjustments([start, rating(D, 'push', 'tooEasy'), rating(D, 'push', 'ok')], rules)).toEqual([]);
    const events = [start, rating(D, 'push', 'ok'), rating(D, 'push', 'tooEasy'), rating(D, 'push', 'tooEasy')];
    expect(pendingAdjustments(events, rules)).toHaveLength(1);
  });

  it('does not mix Ratings of different Progressions', () => {
    const events = [start, rating(D, 'push', 'tooEasy'), rating(D, 'squat', 'tooEasy')];
    expect(pendingAdjustments(events, rules)).toEqual([]);
  });

  it('starts counting again after an accepted Adjustment', () => {
    const events = [
      start,
      rating(D, 'push', 'tooEasy'),
      rating(D, 'push', 'tooEasy'),
      accepted(D, 'push', { step: 2, target: 8 }, { step: 2, target: 10 }),
      rating('2026-10-06', 'push', 'tooEasy'),
    ];
    expect(pendingAdjustments(events, rules)).toEqual([]);
  });

  it('starts counting again after a dismissed Adjustment', () => {
    const events = [start, rating(D, 'push', 'tooEasy'), rating(D, 'push', 'tooEasy'), dismissed(D, 'push')];
    expect(pendingAdjustments(events, rules)).toEqual([]);
  });

  it('starts counting again after a redone Placement', () => {
    const events = [start, rating(D, 'push', 'tooEasy'), placement('2026-10-06'), rating('2026-10-06', 'push', 'tooEasy')];
    expect(pendingAdjustments(events, rules)).toEqual([]);
  });

  it('honours the "ratings in a row" setting and the on/off switch', () => {
    const events = [start, rating(D, 'push', 'tooEasy'), rating(D, 'push', 'tooEasy')];
    expect(pendingAdjustments(events, { ...rules, ratingsInARow: 3 })).toEqual([]);
    expect(pendingAdjustments(events, { ...rules, enabled: false })).toEqual([]);
  });
});
