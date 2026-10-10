import { describe, expect, it } from 'vitest';
import { exerciseFor, lastStep } from './catalog/progressions';
import { placementLevels, type PlankAnswer, type PushUpAnswer, type SquatAnswer } from './placement';
import { PROGRESSION_IDS } from './primitives';
import { DEFAULT_SETTINGS } from './settings';

const PUSH_UPS: PushUpAnswer[] = ['0', '1-5', '6-15', '15+'];
const SQUATS: SquatAnswer[] = ['under10', '10-25', '25+'];
const PLANKS: PlankAnswer[] = ['under20', '20-45', '45+'];

describe('placementLevels', () => {
  it('puts someone who can do about 5 push-ups on knee push-ups', () => {
    const levels = placementLevels({ pushUps: '1-5', squats: '10-25', plank: '20-45' });
    expect(exerciseFor('push', levels.push.step).id).toBe('knee-push-up');
    expect(levels.push.target).toBe(8);
  });

  it('places a strong plank on a 45-second plank', () => {
    const levels = placementLevels({ pushUps: '0', squats: 'under10', plank: '45+' });
    expect(exerciseFor('coreHold', levels.coreHold.step).id).toBe('plank');
    expect(levels.coreHold.target).toBe(45);
  });

  it('produces a valid level for every Progression for every combination of answers', () => {
    const { repCeiling, holdCeiling } = DEFAULT_SETTINGS.adjustments;
    for (const pushUps of PUSH_UPS) for (const squats of SQUATS) for (const plank of PLANKS) {
      const levels = placementLevels({ pushUps, squats, plank });
      for (const id of PROGRESSION_IDS) {
        const { step, target } = levels[id];
        expect(step).toBeLessThanOrEqual(lastStep(id));
        const ceiling = exerciseFor(id, step).mode === 'reps' ? repCeiling : holdCeiling;
        expect(target).toBeGreaterThanOrEqual(1);
        expect(target).toBeLessThanOrEqual(ceiling);
      }
    }
  });
});
