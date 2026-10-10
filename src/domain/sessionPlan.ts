import type { ExerciseMode } from './catalog/exercises';
import { exerciseFor } from './catalog/progressions';
import { ROUTINES } from './catalog/routines';
import { WARMUP } from './catalog/warmup';
import type { Levels, ProgressionId, RoutineId } from './primitives';
import type { SessionSettings } from './settings';

export type PlanStep =
  | { kind: 'warmup'; name: string; seconds: number; cues: string[] }
  | { kind: 'exercise'; round: number; progression: ProgressionId; exerciseId: string; mode: ExerciseMode; target: number }
  | { kind: 'rest'; seconds: number };

/** Rough time per rep, used only to estimate Session length. */
export const SECONDS_PER_REP = 3;

export function buildSessionPlan(routineId: RoutineId, levels: Levels, settings: SessionSettings): PlanStep[] {
  const routine = ROUTINES[routineId];
  const plan: PlanStep[] = [];

  if (routine.warmup && settings.warmupEnabled) {
    for (const move of WARMUP) plan.push({ kind: 'warmup', ...move });
  }

  for (let round = 1; round <= routine.rounds; round++) {
    if (round > 1) plan.push({ kind: 'rest', seconds: settings.roundRestSeconds });
    routine.slots.forEach((progression, index) => {
      if (index > 0) plan.push({ kind: 'rest', seconds: settings.restSeconds });
      const level = levels[progression];
      const exercise = exerciseFor(progression, level.step);
      plan.push({ kind: 'exercise', round, progression, exerciseId: exercise.id, mode: exercise.mode, target: level.target });
    });
  }
  return plan;
}

export function estimateSeconds(plan: PlanStep[]): number {
  return plan.reduce((total, step) => {
    if (step.kind === 'exercise') return total + (step.mode === 'reps' ? step.target * SECONDS_PER_REP : step.target);
    return total + step.seconds;
  }, 0);
}
