import { describe, expect, it } from 'vitest';
import { addDays, daysBetween, eachDay, isMonday, mondayOf, toLocalDate } from './dates';

describe('addDays', () => {
  it('crosses month and year boundaries', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('never skips or doubles a day across daylight-saving changes', () => {
    expect(addDays('2026-03-28', 1)).toBe('2026-03-29');
    expect(addDays('2026-03-29', 1)).toBe('2026-03-30');
    expect(addDays('2026-10-24', 2)).toBe('2026-10-26');
    expect(eachDay('2026-03-27', '2026-03-31')).toHaveLength(5);
  });
});

describe('daysBetween', () => {
  it('counts calendar days in either direction', () => {
    expect(daysBetween('2026-10-01', '2026-10-10')).toBe(9);
    expect(daysBetween('2026-10-10', '2026-10-01')).toBe(-9);
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2);
  });
});

describe('mondayOf / isMonday', () => {
  it('finds the Monday that starts the week', () => {
    expect(mondayOf('2026-10-10')).toBe('2026-10-05'); // Saturday
    expect(mondayOf('2026-10-11')).toBe('2026-10-05'); // Sunday belongs to the previous week
    expect(mondayOf('2026-10-05')).toBe('2026-10-05');
    expect(mondayOf('2026-10-12')).toBe('2026-10-12');
  });

  it('recognises Mondays', () => {
    expect(isMonday('2026-10-05')).toBe(true);
    expect(isMonday('2026-10-10')).toBe(false);
  });
});

describe('eachDay', () => {
  it('lists every day inclusively', () => {
    expect(eachDay('2026-09-29', '2026-10-02')).toEqual(['2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02']);
  });

  it('is empty when the range is reversed', () => {
    expect(eachDay('2026-10-02', '2026-10-01')).toEqual([]);
  });
});

describe('toLocalDate', () => {
  it('uses the device-local calendar day, including just after midnight', () => {
    expect(toLocalDate(new Date(2026, 9, 10, 0, 30))).toBe('2026-10-10');
    expect(toLocalDate(new Date(2026, 9, 10, 23, 59))).toBe('2026-10-10');
  });
});
