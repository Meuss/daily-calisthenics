import { PROGRESSION_IDS, type Levels, type ProgressionId } from '../primitives';
import { EXERCISES, EXERCISE_LIST, type Exercise } from './exercises';

export type Progression = { id: ProgressionId; name: string; steps: string[] };

const NAMES: Record<ProgressionId, string> = {
  push: 'Push',
  squat: 'Squat',
  hinge: 'Hinge',
  lunge: 'Lunge',
  coreHold: 'Core (hold)',
  coreDynamic: 'Core (dynamic)',
  back: 'Back',
};

export const PROGRESSIONS = Object.fromEntries(
  PROGRESSION_IDS.map((id) => [
    id,
    { id, name: NAMES[id], steps: EXERCISE_LIST.filter((exercise) => exercise.progression === id).map((exercise) => exercise.id) },
  ]),
) as Record<ProgressionId, Progression>;

export function exerciseFor(progression: ProgressionId, step: number): Exercise {
  const id = PROGRESSIONS[progression].steps[step];
  const exercise = id === undefined ? undefined : EXERCISES[id];
  if (!exercise) throw new Error(`No step ${step} in Progression ${progression}`);
  return exercise;
}

export function lastStep(progression: ProgressionId): number {
  return PROGRESSIONS[progression].steps.length - 1;
}

export function defaultLevels(): Levels {
  return Object.fromEntries(
    PROGRESSION_IDS.map((id) => [id, { step: 0, target: exerciseFor(id, 0).startTarget }]),
  ) as Levels;
}
