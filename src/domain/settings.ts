import { z } from 'zod';

const TimeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Expected HH:MM');

export const ReminderSettingsSchema = z.object({
  enabled: z.boolean(),
  time: TimeSchema,
  nudgeEnabled: z.boolean(),
  nudgeTime: TimeSchema,
});
export type ReminderSettings = z.infer<typeof ReminderSettingsSchema>;

export const FreezePolicySchema = z.object({
  enabled: z.boolean(),
  perWeek: z.number().int().min(0).max(7),
  maxBanked: z.number().int().min(0).max(7),
});
export type FreezePolicy = z.infer<typeof FreezePolicySchema>;

export const AdjustmentRulesSchema = z.object({
  enabled: z.boolean(),
  ratingsInARow: z.number().int().min(1).max(10),
  repIncrement: z.number().int().min(1),
  holdIncrement: z.number().int().min(1),
  repCeiling: z.number().int().min(1),
  holdCeiling: z.number().int().min(1),
  repFloor: z.number().int().min(1),
  holdFloor: z.number().int().min(1),
}).superRefine((rules, ctx) => {
  // Guarantees nextLevel never goes below the floor (and so never below 1).
  if (rules.repFloor + rules.repIncrement > rules.repCeiling) {
    ctx.addIssue({ code: 'custom', path: ['repFloor'], message: 'Rep floor plus increment must not exceed the rep ceiling' });
  }
  if (rules.holdFloor + rules.holdIncrement > rules.holdCeiling) {
    ctx.addIssue({ code: 'custom', path: ['holdFloor'], message: 'Hold floor plus increment must not exceed the hold ceiling' });
  }
});
export type AdjustmentRules = z.infer<typeof AdjustmentRulesSchema>;

export const SessionSettingsSchema = z.object({
  restSeconds: z.number().int().min(0).max(300),
  roundRestSeconds: z.number().int().min(0).max(600),
  warmupEnabled: z.boolean(),
  cue: z.enum(['beep', 'vibrate', 'both', 'none']),
  keepAwake: z.boolean(),
});
export type SessionSettings = z.infer<typeof SessionSettingsSchema>;

export const AppSettingsSchema = z.object({
  reminder: ReminderSettingsSchema,
  freeze: FreezePolicySchema,
  adjustments: AdjustmentRulesSchema,
  session: SessionSettingsSchema,
  weighInPromptAfterSession: z.boolean(),
});
export type AppSettings = z.infer<typeof AppSettingsSchema>;

export const DEFAULT_SETTINGS: AppSettings = {
  reminder: { enabled: true, time: '07:30', nudgeEnabled: true, nudgeTime: '09:00' },
  freeze: { enabled: true, perWeek: 1, maxBanked: 2 },
  adjustments: {
    enabled: true,
    ratingsInARow: 2,
    repIncrement: 2,
    holdIncrement: 5,
    repCeiling: 12,
    holdCeiling: 60,
    repFloor: 4,
    holdFloor: 10,
  },
  session: { restSeconds: 30, roundRestSeconds: 60, warmupEnabled: true, cue: 'both', keepAwake: true },
  weighInPromptAfterSession: true,
};
