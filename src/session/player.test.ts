import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, placementLevels, type PlanStep } from '../domain';
import { createMemoryKeyValueStore } from '../data/kvStore';
import {
  currentStep,
  loadResumable,
  nextExercise,
  playerReducer,
  progressOf,
  ratableExercises,
  saveSnapshot,
  skippedProgressions,
  startPlayer,
  type PlayerAction,
  type PlayerState,
} from './player';

const levels = placementLevels({ pushUps: '1-5', squats: '10-25', plank: '20-45' });
const settings = DEFAULT_SETTINGS.session;
const D = '2026-10-10';
const tick: PlayerAction = { type: 'tick' };
const done: PlayerAction = { type: 'done' };
const skip: PlayerAction = { type: 'skip' };
const start = () => startPlayer('A', levels, settings, D);
const run = (state: PlayerState, ...actions: PlayerAction[]) => actions.reduce(playerReducer, state);
const times = (n: number, action: PlayerAction) => Array<PlayerAction>(n).fill(action);

/** Plays a whole Session, skipping the Exercises `shouldSkip` picks. */
function playThrough(state: PlayerState, shouldSkip: (step: PlanStep) => boolean): PlayerState {
  let s = state;
  while (!s.finished) {
    const step = currentStep(s) as PlanStep;
    s = playerReducer(s, step.kind === 'exercise' && shouldSkip(step) ? skip : done);
  }
  return s;
}

describe('playerReducer', () => {
  it('starts on the first Warm-up move with its countdown', () => {
    const s = start();
    expect(currentStep(s)).toMatchObject({ kind: 'warmup', name: 'Arm circles' });
    expect(s.remaining).toBe(20);
  });

  it('counts down and moves on when the time is up', () => {
    const s = run(start(), ...times(19, tick));
    expect(s.remaining).toBe(1);
    const next = run(s, tick);
    expect(currentStep(next)).toMatchObject({ kind: 'warmup', name: 'Hip circles' });
    expect(next.remaining).toBe(20);
  });

  it('waits for Done on a reps Exercise', () => {
    const s = run(start(), ...times(4, done));
    expect(currentStep(s)).toMatchObject({ kind: 'exercise', exerciseId: 'knee-push-up', target: 8 });
    expect(s.remaining).toBeNull();
    expect(run(s, tick)).toBe(s);
    expect(currentStep(run(s, done))).toMatchObject({ kind: 'rest', seconds: 30 });
  });

  it('times a Hold from its Target', () => {
    const s = run(start(), ...times(8, done));
    expect(currentStep(s)).toMatchObject({ kind: 'exercise', exerciseId: 'plank', mode: 'hold' });
    expect(s.remaining).toBe(20);
  });

  it('ignores ticks while paused, and Done also resumes', () => {
    const paused = run(start(), { type: 'pause' });
    expect(run(paused, tick)).toBe(paused);
    const next = run(paused, done);
    expect(next.paused).toBe(false);
    expect(currentStep(next)).toMatchObject({ name: 'Hip circles' });
  });

  it('records skipped Exercises but not skipped rests', () => {
    const s = run(start(), ...times(4, done), skip);
    expect(s.skippedSteps).toEqual([4]);
    expect(run(s, skip).skippedSteps).toEqual([4]);
  });

  it('skips rests set to 0 seconds', () => {
    const s = run(startPlayer('A', levels, { ...settings, restSeconds: 0 }, D), ...times(5, done));
    expect(currentStep(s)).toMatchObject({ kind: 'exercise', progression: 'squat' });
  });

  it('finishes after the last step and then ignores actions', () => {
    const fresh = start();
    const s = run(fresh, ...times(fresh.plan.length, done));
    expect(s.finished).toBe(true);
    expect(currentStep(s)).toBeUndefined();
    expect(run(s, skip)).toBe(s);
  });

  it('can be replaced by a fresh Short Routine', () => {
    const short = startPlayer('short', levels, settings, D);
    const s = run(start(), { type: 'pause' }, { type: 'replace', state: short });
    expect(s).toBe(short);
    expect(currentStep(s)).toMatchObject({ kind: 'exercise', progression: 'squat' });
  });
});

describe('Session helpers', () => {
  it('shows the next Exercise during a rest', () => {
    const s = run(start(), ...times(5, done));
    expect(currentStep(s)).toMatchObject({ kind: 'rest' });
    expect(nextExercise(s)).toMatchObject({ exerciseId: 'squat' });
  });

  it('counts Exercises for the header', () => {
    expect(progressOf(start())).toEqual({ exercise: 0, total: 12 });
    expect(progressOf(run(start(), ...times(4, done)))).toEqual({ exercise: 1, total: 12 });
    expect(progressOf(run(start(), ...times(6, done)))).toEqual({ exercise: 2, total: 12 });
  });

  it('rates every Slot done at least once, in Slot order', () => {
    const s = playThrough(start(), () => false);
    expect(ratableExercises(s)).toEqual([
      { progression: 'push', exerciseId: 'knee-push-up' },
      { progression: 'squat', exerciseId: 'squat' },
      { progression: 'coreHold', exerciseId: 'plank' },
      { progression: 'back', exerciseId: 'prone-ytw' },
    ]);
    expect(skippedProgressions(s)).toEqual([]);
  });

  it('logs a Slot skipped in one Round but still rates it', () => {
    let skippedOnce = false;
    const s = playThrough(start(), (step) => {
      if (step.kind !== 'exercise' || step.progression !== 'push' || skippedOnce) return false;
      skippedOnce = true;
      return true;
    });
    expect(skippedProgressions(s)).toEqual(['push']);
    expect(ratableExercises(s).map((r) => r.progression)).toContain('push');
  });

  it('does not rate a Slot skipped in every Round', () => {
    const s = playThrough(start(), (step) => step.kind === 'exercise' && step.progression === 'push');
    expect(ratableExercises(s).map((r) => r.progression)).toEqual(['squat', 'coreHold', 'back']);
  });
});

describe('resume snapshot', () => {
  it('offers to resume the same day, paused', () => {
    const kv = createMemoryKeyValueStore();
    const s = run(start(), ...times(6, done));
    saveSnapshot(kv, s);
    expect(loadResumable(kv, D)).toEqual({ ...s, paused: true });
  });

  it('forgets a Session from another day', () => {
    const kv = createMemoryKeyValueStore();
    saveSnapshot(kv, start());
    expect(loadResumable(kv, '2026-10-11')).toBeNull();
  });

  it('clears the snapshot when the Session ends or is abandoned', () => {
    const kv = createMemoryKeyValueStore();
    saveSnapshot(kv, start());
    const fresh = start();
    saveSnapshot(kv, run(fresh, ...times(fresh.plan.length, done)));
    expect(loadResumable(kv, D)).toBeNull();
    saveSnapshot(kv, start());
    saveSnapshot(kv, null);
    expect(loadResumable(kv, D)).toBeNull();
  });

  it('ignores a corrupt snapshot', () => {
    const kv = createMemoryKeyValueStore();
    kv.set('session-in-progress', '{oops');
    expect(loadResumable(kv, D)).toBeNull();
    kv.set('session-in-progress', JSON.stringify({ version: 99 }));
    expect(loadResumable(kv, D)).toBeNull();
  });
});
