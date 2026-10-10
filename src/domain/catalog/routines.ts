import type { ProgressionId, RotationRoutineId, RoutineId } from '../primitives';

export type Routine = {
  id: RoutineId;
  name: string;
  slots: ProgressionId[];
  rounds: number;
  warmup: boolean;
};

export const ROUTINES: Record<RoutineId, Routine> = {
  A: { id: 'A', name: 'Push & core', slots: ['push', 'squat', 'coreHold', 'back'], rounds: 3, warmup: true },
  B: { id: 'B', name: 'Legs & back', slots: ['lunge', 'hinge', 'push', 'coreDynamic'], rounds: 3, warmup: true },
  C: { id: 'C', name: 'Full body', slots: ['squat', 'push', 'back', 'coreHold'], rounds: 3, warmup: true },
  short: { id: 'short', name: 'Short Routine', slots: ['squat', 'push', 'coreHold'], rounds: 1, warmup: false },
};

export const ROTATION: RotationRoutineId[] = ['A', 'B', 'C'];

export const SHORT_ROUTINE_ID: RoutineId = 'short';
