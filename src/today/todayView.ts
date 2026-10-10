import {
  EXERCISES,
  ROUTINES,
  buildSessionPlan,
  computeStreak,
  deriveLevels,
  deriveWeighIns,
  estimateSeconds,
  nextRoutineId,
  type AppSettings,
  type DomainEvent,
  type ExerciseMode,
  type LocalDate,
} from '../domain';

export type TodayView = {
  streak: number;
  best: number;
  freezes: number;
  doneToday: boolean;
  routineName: string;
  preview: { exerciseId: string; name: string; mode: ExerciseMode; target: number }[];
  estimatedMinutes: number;
  weighInToday: number | null;
  resumable: boolean;
};

export function todayView(events: DomainEvent[], settings: AppSettings, today: LocalDate, resumable: boolean): TodayView {
  const streak = computeStreak(events, today);
  const routineId = nextRoutineId(events);
  const plan = buildSessionPlan(routineId, deriveLevels(events), settings.session);
  const preview = plan.flatMap((step) =>
    step.kind === 'exercise' && step.round === 1
      ? [{ exerciseId: step.exerciseId, name: EXERCISES[step.exerciseId].name, mode: step.mode, target: step.target }]
      : [],
  );
  return {
    streak: streak.current,
    best: streak.best,
    freezes: streak.freezesAvailable,
    doneToday: events.some((e) => e.type === 'sessionFinished' && e.date === today),
    routineName: ROUTINES[routineId].name,
    preview,
    estimatedMinutes: Math.round(estimateSeconds(plan) / 60),
    weighInToday: deriveWeighIns(events).find((w) => w.date === today)?.kg ?? null,
    resumable,
  };
}
