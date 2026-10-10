/** A device-local calendar day, formatted 'YYYY-MM-DD'. ISO strings compare correctly with < and >. */
export type LocalDate = string;

const MS_PER_DAY = 86_400_000;

// Arithmetic is done on UTC midnights so daylight-saving changes can never shift a day.
function toUtcMs(date: LocalDate): number {
  const [year, month, day] = date.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

function fromUtcMs(ms: number): LocalDate {
  return new Date(ms).toISOString().slice(0, 10);
}

export function addDays(date: LocalDate, days: number): LocalDate {
  return fromUtcMs(toUtcMs(date) + days * MS_PER_DAY);
}

export function daysBetween(from: LocalDate, to: LocalDate): number {
  return Math.round((toUtcMs(to) - toUtcMs(from)) / MS_PER_DAY);
}

export function isMonday(date: LocalDate): boolean {
  return new Date(toUtcMs(date)).getUTCDay() === 1;
}

export function mondayOf(date: LocalDate): LocalDate {
  const dayOfWeek = new Date(toUtcMs(date)).getUTCDay(); // 0 = Sunday
  return addDays(date, -((dayOfWeek + 6) % 7));
}

export function eachDay(from: LocalDate, to: LocalDate): LocalDate[] {
  const days: LocalDate[] = [];
  for (let date = from; date <= to; date = addDays(date, 1)) days.push(date);
  return days;
}

export function toLocalDate(instant: Date): LocalDate {
  const year = instant.getFullYear();
  const month = String(instant.getMonth() + 1).padStart(2, '0');
  const day = String(instant.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
