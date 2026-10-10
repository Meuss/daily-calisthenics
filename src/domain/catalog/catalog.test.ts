import { describe, expect, it } from 'vitest';
import { PROGRESSION_IDS } from '../primitives';
import { DEFAULT_SETTINGS } from '../settings';
import { EXERCISE_LIST } from './exercises';
import { PROGRESSIONS, defaultLevels, exerciseFor, lastStep } from './progressions';
import { ROTATION, ROUTINES, SHORT_ROUTINE_ID } from './routines';
import { WARMUP } from './warmup';

const { repCeiling, holdCeiling } = DEFAULT_SETTINGS.adjustments;

describe('Exercise library', () => {
  it('has unique Exercise ids', () => {
    const ids = EXERCISE_LIST.map((exercise) => exercise.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives every Progression at least 3 steps that belong to it', () => {
    for (const id of PROGRESSION_IDS) {
      expect(PROGRESSIONS[id].steps.length).toBeGreaterThanOrEqual(3);
      for (let step = 0; step <= lastStep(id); step++) expect(exerciseFor(id, step).progression).toBe(id);
    }
  });

  it('starts every Exercise below its ceiling so it can be progressed', () => {
    for (const exercise of EXERCISE_LIST) {
      const ceiling = exercise.mode === 'reps' ? repCeiling : holdCeiling;
      expect(exercise.startTarget).toBeLessThan(ceiling);
      expect(exercise.cues.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('throws on a step outside the Progression', () => {
    expect(() => exerciseFor('push', 99)).toThrow('No step 99 in Progression push');
  });

  it('starts every Progression at step 0 with its start Target by default', () => {
    const levels = defaultLevels();
    expect(levels.push).toEqual({ step: 0, target: exerciseFor('push', 0).startTarget });
    expect(Object.keys(levels).sort()).toEqual([...PROGRESSION_IDS].sort());
  });
});

describe('Routines', () => {
  it('fills full Routines with 4 Slots × 3 Rounds and a Warm-up', () => {
    for (const id of ROTATION) {
      expect(ROUTINES[id].slots).toHaveLength(4);
      expect(ROUTINES[id].rounds).toBe(3);
      expect(ROUTINES[id].warmup).toBe(true);
    }
  });

  it('keeps the Short Routine to one Round without Warm-up and out of the Rotation', () => {
    const short = ROUTINES[SHORT_ROUTINE_ID];
    expect(short.rounds).toBe(1);
    expect(short.warmup).toBe(false);
    expect(ROTATION).not.toContain(SHORT_ROUTINE_ID);
  });

  it('only names known Progressions in Slots', () => {
    for (const routine of Object.values(ROUTINES)) {
      for (const slot of routine.slots) expect(PROGRESSION_IDS).toContain(slot);
    }
  });

  it('has a 90-second Warm-up', () => {
    expect(WARMUP.reduce((total, move) => total + move.seconds, 0)).toBe(90);
  });
});
