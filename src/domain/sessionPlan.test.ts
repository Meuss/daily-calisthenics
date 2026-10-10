import { describe, expect, it } from 'vitest';
import { ROTATION } from './catalog/routines';
import { placementLevels } from './placement';
import { buildSessionPlan, estimateSeconds } from './sessionPlan';
import { DEFAULT_SETTINGS } from './settings';

const settings = DEFAULT_SETTINGS.session;
const levels = placementLevels({ pushUps: '1-5', squats: '10-25', plank: '20-45' });

describe('buildSessionPlan', () => {
  it('lays out Warm-up, then 3 Rounds of 4 Exercises with rests in between', () => {
    const plan = buildSessionPlan('A', levels, settings);
    expect(plan.filter((s) => s.kind === 'warmup')).toHaveLength(4);
    expect(plan.filter((s) => s.kind === 'exercise')).toHaveLength(12);
    expect(plan.filter((s) => s.kind === 'rest')).toHaveLength(3 * 3 + 2);
    expect(plan[0].kind).toBe('warmup');
    expect(plan[plan.length - 1].kind).toBe('exercise');
  });

  it('fills each Slot from the current Progression Step and Target', () => {
    const plan = buildSessionPlan('A', levels, settings);
    expect(plan.find((s) => s.kind === 'exercise')).toEqual({
      kind: 'exercise', round: 1, progression: 'push', exerciseId: 'knee-push-up', mode: 'reps', target: 8,
    });
    expect(plan.find((s) => s.kind === 'exercise' && s.progression === 'coreHold')).toMatchObject({ mode: 'hold', target: 20 });
  });

  it('uses the rest settings', () => {
    const plan = buildSessionPlan('A', levels, { ...settings, restSeconds: 15, roundRestSeconds: 90 });
    const rests = plan.flatMap((s) => (s.kind === 'rest' ? [s.seconds] : []));
    expect(rests.filter((s) => s === 15)).toHaveLength(9);
    expect(rests.filter((s) => s === 90)).toHaveLength(2);
  });

  it('leaves out the Warm-up when it is switched off', () => {
    expect(buildSessionPlan('A', levels, { ...settings, warmupEnabled: false }).some((s) => s.kind === 'warmup')).toBe(false);
  });

  it('makes the Short Routine a single Round without Warm-up', () => {
    const plan = buildSessionPlan('short', levels, settings);
    expect(plan.some((s) => s.kind === 'warmup')).toBe(false);
    expect(plan.filter((s) => s.kind === 'exercise')).toHaveLength(3);
  });
});

describe('estimateSeconds', () => {
  it('keeps every full Routine between 10 and 14 minutes for a beginner', () => {
    for (const id of ROTATION) {
      const minutes = estimateSeconds(buildSessionPlan(id, levels, settings)) / 60;
      expect(minutes).toBeGreaterThanOrEqual(10);
      expect(minutes).toBeLessThanOrEqual(14);
    }
  });

  it('keeps the Short Routine under 4 minutes', () => {
    expect(estimateSeconds(buildSessionPlan('short', levels, settings))).toBeLessThanOrEqual(240);
  });
});
