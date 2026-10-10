import { z } from 'zod';

export const ProgressionIdSchema = z.enum(['push', 'squat', 'hinge', 'lunge', 'coreHold', 'coreDynamic', 'back']);
export type ProgressionId = z.infer<typeof ProgressionIdSchema>;
export const PROGRESSION_IDS: readonly ProgressionId[] = ProgressionIdSchema.options;

export const RotationRoutineIdSchema = z.enum(['A', 'B', 'C']);
export type RotationRoutineId = z.infer<typeof RotationRoutineIdSchema>;

export const RoutineIdSchema = z.enum(['A', 'B', 'C', 'short']);
export type RoutineId = z.infer<typeof RoutineIdSchema>;

export const RatingSchema = z.enum(['tooEasy', 'ok', 'tooHard']);
export type Rating = z.infer<typeof RatingSchema>;

export const LocalDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected a YYYY-MM-DD date');

export const LevelSchema = z.object({
  step: z.number().int().min(0),
  target: z.number().int().min(1),
});
export type ProgressionLevel = { step: number; target: number };

export const LevelsSchema = z.record(ProgressionIdSchema, LevelSchema);
export type Levels = Record<ProgressionId, ProgressionLevel>;
