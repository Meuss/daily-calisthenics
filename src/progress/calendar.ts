import { addDays, mondayOf, type DayRecord, type DayStatus, type LocalDate } from '../domain';

export type CalendarCell = { date: LocalDate; status: DayStatus | 'none' | 'future' };

export function calendarWeeks(days: DayRecord[], today: LocalDate, weeks = 5): CalendarCell[][] {
  const statusByDate = new Map(days.map((day) => [day.date, day.status]));
  const firstMonday = mondayOf(addDays(today, -7 * (weeks - 1)));
  return Array.from({ length: weeks }, (_, week) =>
    Array.from({ length: 7 }, (_, weekday) => {
      const date = addDays(firstMonday, week * 7 + weekday);
      const status = date > today ? 'future' : (statusByDate.get(date) ?? 'none');
      return { date, status };
    }),
  );
}
