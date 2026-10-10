import { describe, expect, it } from 'vitest';
import { nextRoutineId } from './rotation';
import { placement, session } from './testing/builders';

describe('nextRoutineId', () => {
  it('starts with Routine A', () => {
    expect(nextRoutineId([])).toBe('A');
  });

  it('advances A → B → C → A as full Routines are finished', () => {
    expect(nextRoutineId([session('2026-10-05', 'A')])).toBe('B');
    expect(nextRoutineId([session('2026-10-05', 'A'), session('2026-10-06', 'B'), session('2026-10-07', 'C')])).toBe('A');
  });

  it('does not advance on missed days', () => {
    // A on Monday, nothing Tuesday → B on Wednesday
    expect(nextRoutineId([session('2026-10-05', 'A')])).toBe('B');
  });

  it('does not advance for the Short Routine, even on the same day as a full one', () => {
    expect(nextRoutineId([session('2026-10-05', 'short')])).toBe('A');
    expect(nextRoutineId([session('2026-10-05', 'short'), session('2026-10-05', 'A')])).toBe('B');
  });

  it('restarts from the Rotation start chosen in Placement', () => {
    expect(nextRoutineId([session('2026-10-05', 'A'), placement('2026-10-06', undefined, 'C')])).toBe('C');
    expect(nextRoutineId([placement('2026-10-06', undefined, 'C'), session('2026-10-06', 'C')])).toBe('A');
  });
});
