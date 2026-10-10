import { z } from 'zod';
import {
  LevelSchema,
  LevelsSchema,
  LocalDateSchema,
  ProgressionIdSchema,
  RatingSchema,
  RotationRoutineIdSchema,
  RoutineIdSchema,
} from './primitives';
import { FreezePolicySchema } from './settings';

/**
 * Every event carries `at` (ISO instant it was recorded) and `date` (the local calendar day it applies to).
 * For a backfilled Weigh-in, `date` is the day the weight belongs to, not the day it was typed in.
 */
const base = { at: z.string().min(1), date: LocalDateSchema };

export const DomainEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('placementCompleted'), ...base, levels: LevelsSchema, rotationStart: RotationRoutineIdSchema }),
  z.object({ type: z.literal('sessionFinished'), ...base, routineId: RoutineIdSchema, skipped: z.array(ProgressionIdSchema) }),
  z.object({ type: z.literal('ratingGiven'), ...base, progression: ProgressionIdSchema, exerciseId: z.string().min(1), rating: RatingSchema }),
  z.object({ type: z.literal('adjustmentAccepted'), ...base, progression: ProgressionIdSchema, from: LevelSchema, to: LevelSchema }),
  z.object({ type: z.literal('adjustmentDismissed'), ...base, progression: ProgressionIdSchema }),
  z.object({ type: z.literal('weighInRecorded'), ...base, kg: z.number().min(20).max(400) }),
  z.object({ type: z.literal('weighInDeleted'), ...base }),
  z.object({ type: z.literal('freezePolicySet'), ...base, policy: FreezePolicySchema }),
]);

export type DomainEvent = z.infer<typeof DomainEventSchema>;
export type EventOf<T extends DomainEvent['type']> = Extract<DomainEvent, { type: T }>;
