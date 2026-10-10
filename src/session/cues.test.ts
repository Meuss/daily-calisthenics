import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, placementLevels } from '../domain';
import { cueFor } from './cues';
import { playerReducer, startPlayer, type PlayerState } from './player';

const levels = placementLevels({ pushUps: '1-5', squats: '10-25', plank: '20-45' });
const start = () => startPlayer('short', levels, DEFAULT_SETTINGS.session, '2026-10-10');

describe('cueFor', () => {
  it('cues the start of a new step', () => {
    const s = start();
    expect(cueFor(s, playerReducer(s, { type: 'done' }))).toBe('stepStart');
  });

  it('counts down the last 3 seconds of a timed step', () => {
    let s: PlayerState = playerReducer(start(), { type: 'done' }); // rest, 30 s
    for (let i = 0; i < 26; i++) s = playerReducer(s, { type: 'tick' });
    expect(s.remaining).toBe(4);
    const three = playerReducer(s, { type: 'tick' });
    expect(cueFor(s, three)).toBe('countdown');
    expect(cueFor(playerReducer(start(), { type: 'done' }), playerReducer(playerReducer(start(), { type: 'done' }), { type: 'tick' }))).toBeNull();
  });

  it('cues the end of the Session', () => {
    let s = start();
    while (s.index < s.plan.length - 1) s = playerReducer(s, { type: 'done' });
    expect(cueFor(s, playerReducer(s, { type: 'done' }))).toBe('finished');
  });

  it('stays quiet when nothing changed', () => {
    const s = start();
    expect(cueFor(s, playerReducer(s, { type: 'pause' }))).toBeNull();
  });
});
