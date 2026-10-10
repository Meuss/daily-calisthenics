import { describe, expect, it } from 'vitest';
import { DomainEventSchema } from './events';
import { AppSettingsSchema, DEFAULT_SETTINGS } from './settings';
import { accepted, dismissed, freezePolicy, placement, rating, session, weighIn, weighInDeleted } from './testing/builders';

describe('DomainEventSchema', () => {
  it('accepts every event the builders produce', () => {
    const events = [
      placement('2026-10-05'),
      session('2026-10-05'),
      rating('2026-10-05', 'push', 'tooEasy'),
      accepted('2026-10-06', 'push', { step: 2, target: 8 }, { step: 2, target: 10 }),
      dismissed('2026-10-06', 'squat'),
      weighIn('2026-10-05', 82.4),
      weighInDeleted('2026-10-05'),
      freezePolicy('2026-10-05', { perWeek: 2 }),
    ];
    for (const event of events) expect(DomainEventSchema.parse(event)).toEqual(event);
  });

  it('rejects an impossible Weigh-in', () => {
    expect(DomainEventSchema.safeParse(weighIn('2026-10-05', 5)).success).toBe(false);
  });

  it('rejects a date that is not YYYY-MM-DD', () => {
    expect(DomainEventSchema.safeParse({ ...session('2026-10-05'), date: '10/05/2026' }).success).toBe(false);
  });

  it('rejects an unknown event type', () => {
    expect(DomainEventSchema.safeParse({ type: 'somethingElse', at: 'x', date: '2026-10-05' }).success).toBe(false);
  });
});

describe('DEFAULT_SETTINGS', () => {
  it('is valid against its own schema', () => {
    expect(AppSettingsSchema.parse(DEFAULT_SETTINGS)).toEqual(DEFAULT_SETTINGS);
  });
});

describe('AdjustmentRulesSchema', () => {
  it('rejects rules that could produce a Target below the floor or under 1', () => {
    expect(AppSettingsSchema.safeParse({ ...DEFAULT_SETTINGS, adjustments: { ...DEFAULT_SETTINGS.adjustments, repIncrement: 20 } }).success).toBe(false);
    expect(AppSettingsSchema.safeParse({ ...DEFAULT_SETTINGS, adjustments: { ...DEFAULT_SETTINGS.adjustments, repFloor: 15 } }).success).toBe(false);
    expect(AppSettingsSchema.safeParse({ ...DEFAULT_SETTINGS, adjustments: { ...DEFAULT_SETTINGS.adjustments, holdFloor: 58 } }).success).toBe(false);
  });
});
