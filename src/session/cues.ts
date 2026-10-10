import type { PlayerState } from './player';

export type Cue = 'countdown' | 'stepStart' | 'finished';

export function cueFor(previous: PlayerState, next: PlayerState): Cue | null {
  if (next.finished && !previous.finished) return 'finished';
  if (next.index !== previous.index) return 'stepStart';
  if (next.remaining !== null && next.remaining !== previous.remaining && next.remaining <= 3) return 'countdown';
  return null;
}
