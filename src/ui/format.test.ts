import { describe, expect, it } from 'vitest';
import { formatClock, formatDay, formatTarget, fromMinutes, toMinutes } from './format';

describe('time of day', () => {
  it('converts HH:MM to minutes and back', () => {
    expect(toMinutes('07:30')).toBe(450);
    expect(fromMinutes(450)).toBe('07:30');
    expect(fromMinutes(0)).toBe('00:00');
  });

  it('wraps around midnight', () => {
    expect(fromMinutes(1440)).toBe('00:00');
    expect(fromMinutes(-15)).toBe('23:45');
  });
});

describe('formatClock', () => {
  it('shows minutes and seconds', () => {
    expect(formatClock(5)).toBe('0:05');
    expect(formatClock(90)).toBe('1:30');
    expect(formatClock(-3)).toBe('0:00');
  });
});

describe('formatDay', () => {
  it('shows weekday, day and month', () => {
    expect(formatDay('2026-10-10')).toBe('Sat 10 Oct');
    expect(formatDay('2027-01-01')).toBe('Fri 1 Jan');
  });
});

describe('formatTarget', () => {
  it('uses reps or seconds', () => {
    expect(formatTarget('reps', 8)).toBe('8 reps');
    expect(formatTarget('hold', 20)).toBe('20 s');
  });
});
