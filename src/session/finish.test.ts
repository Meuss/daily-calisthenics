import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, placementLevels, type PlanStep } from '../domain';
import { placement, rating, session } from '../domain/testing/builders';
import { describeAdjustment, ratingEvents, sessionFinishedEvent, sessionOutcome } from './finish';
import { currentStep, playerReducer, startPlayer, type PlayerState } from './player';

const levels = placementLevels({ pushUps: '1-5', squats: '10-25', plank: '20-45' });

function play(state: PlayerState, skipPush = false): PlayerState {
  let s = state;
  while (!s.finished) {
    const step = currentStep(s) as PlanStep;
    s = playerReducer(s, skipPush && step.kind === 'exercise' && step.progression === 'push' ? { type: 'skip' } : { type: 'done' });
  }
  return s;
}

describe('sessionFinishedEvent', () => {
  it('records the Session with its routine and no skips', () => {
    const state = play(startPlayer('A', levels, DEFAULT_SETTINGS.session, '2026-10-10'));
    expect(sessionFinishedEvent(state, new Date(2026, 9, 10, 7, 45))).toMatchObject({ type: 'sessionFinished', date: '2026-10-10', routineId: 'A', skipped: [] });
  });

  it('dates a Session that crossed midnight on the day it was finished', () => {
    const state = play(startPlayer('short', levels, DEFAULT_SETTINGS.session, '2026-10-09'));
    expect(sessionFinishedEvent(state, new Date(2026, 9, 10, 0, 3))).toMatchObject({ date: '2026-10-10' });
  });

  it('logs skipped Slots', () => {
    const state = play(startPlayer('A', levels, DEFAULT_SETTINGS.session, '2026-10-10'), true);
    expect(sessionFinishedEvent(state, new Date(2026, 9, 10, 7, 45))).toMatchObject({ skipped: ['push'] });
  });
});

describe('ratingEvents', () => {
  it('gives one Rating per Exercise, defaulting to ok', () => {
    const state = play(startPlayer('A', levels, DEFAULT_SETTINGS.session, '2026-10-10'));
    expect(ratingEvents(state, { push: 'tooEasy' }, new Date(2026, 9, 10, 7, 45))).toMatchObject([
      { type: 'ratingGiven', date: '2026-10-10', progression: 'push', exerciseId: 'knee-push-up', rating: 'tooEasy' },
      { type: 'ratingGiven', progression: 'squat', rating: 'ok' },
      { type: 'ratingGiven', progression: 'coreHold', rating: 'ok' },
      { type: 'ratingGiven', progression: 'back', rating: 'ok' },
    ]);
  });

  it('does not rate a Slot skipped in every Round', () => {
    const state = play(startPlayer('A', levels, DEFAULT_SETTINGS.session, '2026-10-10'), true);
    expect(ratingEvents(state, {}, new Date(2026, 9, 10, 7, 45)).map((e) => (e.type === 'ratingGiven' ? e.progression : null))).toEqual(['squat', 'coreHold', 'back']);
  });
});

describe('sessionOutcome', () => {
  it('reports the new Streak, new Achievements and suggested Adjustments', () => {
    const before = [
      placement('2026-10-08', levels),
      session('2026-10-08'),
      rating('2026-10-08', 'push', 'tooEasy'),
      session('2026-10-09'),
    ];
    const now = new Date(2026, 9, 10, 7, 45);
    const added = [session('2026-10-10'), rating('2026-10-10', 'push', 'tooEasy')];
    const outcome = sessionOutcome(before, added, DEFAULT_SETTINGS, now);
    expect(outcome.streak).toBe(3);
    expect(outcome.newAchievements.map((a) => a.id)).toEqual(['streak-3']);
    expect(outcome.adjustments).toEqual([
      { progression: 'push', direction: 'up', from: { step: 2, target: 8 }, to: { step: 2, target: 10 } },
    ]);
  });
});

describe('describeAdjustment', () => {
  it('describes a Target change', () => {
    expect(describeAdjustment({ progression: 'push', direction: 'up', from: { step: 2, target: 8 }, to: { step: 2, target: 10 } }))
      .toBe('Knee push-up: 8 reps → 10 reps');
  });

  it('describes moving up or down a Step', () => {
    expect(describeAdjustment({ progression: 'push', direction: 'up', from: { step: 2, target: 12 }, to: { step: 3, target: 5 } }))
      .toBe('Level up: Push-up × 5 reps');
    expect(describeAdjustment({ progression: 'push', direction: 'down', from: { step: 2, target: 4 }, to: { step: 1, target: 10 } }))
      .toBe('Step back: Incline push-up × 10 reps');
  });
});
