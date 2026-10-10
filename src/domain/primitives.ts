import { z } from 'zod';
import { addDays } from './dates';

export const ProgressionIdSchema = z.enum(['push', 'squat', 'hinge', 'lunge', 'coreHold', 'coreDynamic', 'back']);
export type ProgressionId = z.infer<typeof ProgressionIdSchema>;
export const PROGRESSION_IDS: readonly ProgressionId[] = ProgressionIdSchema.options;

export const RotationRoutineIdSchema = z.enum(['A', 'B', 'C']);
export type RotationRoutineId = z.infer<typeof RotationRoutineIdSchema>;

export const RoutineIdSchema = z.enum(['A', 'B', 'C', 'short']);
export type RoutineId = z.infer<typeof RoutineIdSchema>;

export const RatingSchema = z.enum(['tooEasy', 'ok', 'tooHard']);
export type Rating = z.infer<typeof RatingSchema>;

const DATE_SHAPE = /^\d{4}-\d{2}-\d{2}$/;

export const LocalDateSchema = z
  .string()
  .regex(DATE_SHAPE, 'Expected a YYYY-MM-DD date')
  // Zod runs refinements even after the regex fails, so only check real days (no 02-30) on well-shaped input.
  .refine((date) => !DATE_SHAPE.test(date) || addDays(date, 0) === date, 'Not a real calendar date');

export const LevelSchema = z.object({
  step: z.number().int().min(0),
  target: z.number().int().min(1),
});
export type ProgressionLevel = { step: number; target: number };

export const LevelsSchema = z.record(ProgressionIdSchema, LevelSchema);
export type Levels = Record<ProgressionId, ProgressionLevel>;
