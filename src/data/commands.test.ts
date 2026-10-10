import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, DomainEventSchema } from '../domain';
import { placement, session } from '../domain/testing/builders';
import {
  adjustmentDecisionEvent,
  hasPlacement,
  placementEvents,
  settingsChangeEvents,
  validateSettings,
  weighInDeletedEvent,
  weighInEvent,
} from './commands';

const now = new Date(2026, 9, 10, 7, 30);

describe('hasPlacement', () => {
  it('is false until Placement is completed', () => {
    expect(hasPlacement([session('2026-10-05')])).toBe(false);
    expect(hasPlacement([placement('2026-10-05')])).toBe(true);
  });
});

describe('placementEvents', () => {
  it('records the Placement and the Freeze settings in force', () => {
    const events = placementEvents({ pushUps: '1-5', squats: '10-25', plank: '20-45' }, 'B', DEFAULT_SETTINGS, now);
    expect(events.map((e) => e.type)).toEqual(['placementCompleted', 'freezePolicySet']);
    expect(events[0]).toMatchObject({ date: '2026-10-10', rotationStart: 'B', levels: { push: { step: 2, target: 8 } } });
    expect(events[1]).toMatchObject({ date: '2026-10-10', policy: DEFAULT_SETTINGS.freeze });
    for (const event of events) expect(DomainEventSchema.parse(event)).toEqual(event);
  });
});

describe('settingsChangeEvents', () => {
  it('records nothing when the Freeze settings did not change', () => {
    expect(settingsChangeEvents(DEFAULT_SETTINGS, { ...DEFAULT_SETTINGS, weighInPromptAfterSession: false }, now)).toEqual([]);
  });

  it('records the new Freeze settings when they changed', () => {
    const next = { ...DEFAULT_SETTINGS, freeze: { ...DEFAULT_SETTINGS.freeze, perWeek: 2 } };
    expect(settingsChangeEvents(DEFAULT_SETTINGS, next, now)).toEqual([
      { type: 'freezePolicySet', at: now.toISOString(), date: '2026-10-10', policy: next.freeze },
    ]);
  });
});

describe('weighInEvent', () => {
  it('accepts a comma or a dot and rounds to 0.1 kg', () => {
    expect(weighInEvent('2026-10-10', '81,4', now)).toMatchObject({ ok: true, event: { kg: 81.4, date: '2026-10-10' } });
    expect(weighInEvent('2026-10-09', '80.46', now)).toMatchObject({ ok: true, event: { kg: 80.5, date: '2026-10-09' } });
  });

  it('refuses empty input, impossible weights and future days', () => {
    expect(weighInEvent('2026-10-10', '', now)).toEqual({ ok: false, error: 'Weight must be between 20 and 400 kg.' });
    expect(weighInEvent('2026-10-10', 'abc', now)).toEqual({ ok: false, error: 'Weight must be between 20 and 400 kg.' });
    expect(weighInEvent('2026-10-11', '80', now)).toEqual({ ok: false, error: 'A Weigh-in cannot be in the future.' });
  });
});

describe('weighInDeletedEvent', () => {
  it('targets the given day', () => {
    expect(weighInDeletedEvent('2026-10-08', now)).toEqual({ type: 'weighInDeleted', at: now.toISOString(), date: '2026-10-08' });
  });
});

describe('adjustmentDecisionEvent', () => {
  const adjustment = { progression: 'push' as const, direction: 'up' as const, from: { step: 2, target: 8 }, to: { step: 2, target: 10 } };

  it('records an accepted Adjustment with its levels', () => {
    expect(adjustmentDecisionEvent(adjustment, true, now)).toEqual({
      type: 'adjustmentAccepted', at: now.toISOString(), date: '2026-10-10', progression: 'push', from: adjustment.from, to: adjustment.to,
    });
  });

  it('records a dismissed Adjustment', () => {
    expect(adjustmentDecisionEvent(adjustment, false, now)).toEqual({
      type: 'adjustmentDismissed', at: now.toISOString(), date: '2026-10-10', progression: 'push',
    });
  });
});

describe('validateSettings', () => {
  it('accepts the defaults', () => {
    expect(validateSettings(DEFAULT_SETTINGS)).toBeNull();
  });

  it('explains why Adjustment rules that could break Targets are refused', () => {
    const next = { ...DEFAULT_SETTINGS, adjustments: { ...DEFAULT_SETTINGS.adjustments, repFloor: 11 } };
    expect(validateSettings(next)).toBe('Rep floor plus increment must not exceed the rep ceiling');
  });
});
