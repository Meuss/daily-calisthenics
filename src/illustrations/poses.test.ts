import { describe, expect, it } from 'vitest';
import { EXERCISE_LIST, WARMUP } from '../domain';
import { ILLUSTRATIONS, VIEW_HEIGHT, VIEW_WIDTH, type Pose } from './poses';

const pointsOf = (pose: Pose) => [pose.head, pose.neck, pose.hip, ...pose.arms.flat(), ...pose.legs.flat()];

describe('ILLUSTRATIONS', () => {
  it('covers every Exercise and every Warm-up move', () => {
    for (const exercise of EXERCISE_LIST) expect(ILLUSTRATIONS[exercise.id], exercise.id).toBeDefined();
    for (const move of WARMUP) expect(ILLUSTRATIONS[move.name], move.name).toBeDefined();
  });

  it('keeps every point on the canvas', () => {
    for (const [key, illustration] of Object.entries(ILLUSTRATIONS)) {
      for (const pose of illustration.frames) {
        for (const [x, y] of pointsOf(pose)) {
          expect(x, key).toBeGreaterThanOrEqual(0);
          expect(x, key).toBeLessThanOrEqual(VIEW_WIDTH);
          expect(y, key).toBeGreaterThanOrEqual(0);
          expect(y, key).toBeLessThanOrEqual(VIEW_HEIGHT);
        }
      }
    }
  });

  it('shows two different positions for each', () => {
    for (const [key, { frames }] of Object.entries(ILLUSTRATIONS)) {
      expect(JSON.stringify(frames[0]), key).not.toBe(JSON.stringify(frames[1]));
      for (const pose of frames) {
        expect(pose.arms.length, key).toBeGreaterThanOrEqual(1);
        expect(pose.legs.length, key).toBeGreaterThanOrEqual(1);
      }
    }
  });
});
