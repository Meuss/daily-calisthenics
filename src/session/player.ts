import {
  buildSessionPlan,
  type Levels,
  type LocalDate,
  type PlanStep,
  type ProgressionId,
  type RoutineId,
  type SessionSettings,
} from '../domain';
import type { KeyValueStore } from '../data/kvStore';

export type ExerciseStep = Extract<PlanStep, { kind: 'exercise' }>;

export type PlayerState = {
  version: 1;
  routineId: RoutineId;
  startedOn: LocalDate;
  plan: PlanStep[];
  index: number;
  /** Seconds left on a timed step (Warm-up, rest, Hold); null on a reps step. */
  remaining: number | null;
  paused: boolean;
  skippedSteps: number[];
  finished: boolean;
};

export type PlayerAction =
  | { type: 'tick' }
  | { type: 'done' }
  | { type: 'skip' }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'replace'; state: PlayerState };

function secondsFor(step: PlanStep): number | null {
  if (step.kind === 'exercise') return step.mode === 'hold' ? step.target : null;
  return step.seconds;
}

function goTo(state: PlayerState, index: number): PlayerState {
  const step = state.plan[index];
  if (!step) return { ...state, index: state.plan.length, remaining: null, paused: false, finished: true };
  const remaining = secondsFor(step);
  if (remaining === 0) return goTo(state, index + 1);
  return { ...state, index, remaining };
}

export function startPlayer(routineId: RoutineId, levels: Levels, settings: SessionSettings, today: LocalDate): PlayerState {
  return goTo(
    {
      version: 1,
      routineId,
      startedOn: today,
      plan: buildSessionPlan(routineId, levels, settings),
      index: 0,
      remaining: null,
      paused: false,
      skippedSteps: [],
      finished: false,
    },
    0,
  );
}

export function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {
  if (action.type === 'replace') return action.state;
  if (state.finished) return state;

  switch (action.type) {
    case 'pause':
      return { ...state, paused: true };
    case 'resume':
      return { ...state, paused: false };
    case 'tick':
      if (state.paused || state.remaining === null) return state;
      return state.remaining > 1 ? { ...state, remaining: state.remaining - 1 } : goTo(state, state.index + 1);
    case 'done':
      return goTo({ ...state, paused: false }, state.index + 1);
    case 'skip': {
      const isExercise = state.plan[state.index]?.kind === 'exercise';
      const skippedSteps = isExercise ? [...state.skippedSteps, state.index] : state.skippedSteps;
      return goTo({ ...state, skippedSteps, paused: false }, state.index + 1);
    }
  }
}

export function currentStep(state: PlayerState): PlanStep | undefined {
  return state.plan[state.index];
}

export function nextExercise(state: PlayerState): ExerciseStep | undefined {
  return state.plan.slice(state.index + 1).find((step): step is ExerciseStep => step.kind === 'exercise');
}

export function progressOf(state: PlayerState): { exercise: number; total: number } {
  const isExercise = (step: PlanStep) => step.kind === 'exercise';
  return {
    exercise: state.plan.slice(0, state.index + 1).filter(isExercise).length,
    total: state.plan.filter(isExercise).length,
  };
}

/** One entry per Slot that was done in at least one Round, in Slot order. */
export function ratableExercises(state: PlayerState): { progression: ProgressionId; exerciseId: string }[] {
  const seen = new Set<ProgressionId>();
  const result: { progression: ProgressionId; exerciseId: string }[] = [];
  state.plan.forEach((step, index) => {
    if (step.kind !== 'exercise' || state.skippedSteps.includes(index) || seen.has(step.progression)) return;
    seen.add(step.progression);
    result.push({ progression: step.progression, exerciseId: step.exerciseId });
  });
  return result;
}

/** Progressions skipped in at least one Round (logged on the Session for honesty). */
export function skippedProgressions(state: PlayerState): ProgressionId[] {
  const skipped = new Set<ProgressionId>();
  for (const index of state.skippedSteps) {
    const step = state.plan[index];
    if (step?.kind === 'exercise') skipped.add(step.progression);
  }
  return [...skipped];
}

const SNAPSHOT_KEY = 'session-in-progress';

export function saveSnapshot(kv: KeyValueStore, state: PlayerState | null): void {
  if (!state || state.finished) kv.remove(SNAPSHOT_KEY);
  else kv.set(SNAPSHOT_KEY, JSON.stringify(state));
}

/** A Session interrupted today can be resumed (paused); anything else is dropped. */
export function loadResumable(kv: KeyValueStore, today: LocalDate): PlayerState | null {
  const raw = kv.get(SNAPSHOT_KEY);
  if (raw === null) return null;
  try {
    const state = JSON.parse(raw) as PlayerState;
    if (state.version !== 1 || !Array.isArray(state.plan) || state.finished || state.startedOn !== today) return null;
    return { ...state, paused: true };
  } catch {
    return null;
  }
}
