import { addDays, daysBetween, movingAverage7, type LocalDate, type WeighIn } from '../domain';

export const CHART_DAYS = 60;

export type ChartPoint = { date: LocalDate; x: number; y: number };
export type ChartGeometry = { raw: ChartPoint[]; average: string; minKg: number; maxKg: number };

/** Raw Weigh-ins as dots and the 7-day average as a line, over the `days` ending today. */
export function chartGeometry(weighIns: WeighIn[], today: LocalDate, days: number, width: number, height: number, padding = 16): ChartGeometry | null {
  const from = addDays(today, -(days - 1));
  const inWindow = (w: WeighIn) => w.date >= from && w.date <= today;
  const raw = weighIns.filter(inWindow);
  if (raw.length === 0) return null;

  const average = movingAverage7(weighIns).filter(inWindow);
  const values = [...raw, ...average].map((w) => w.kg);
  const minKg = Math.min(...values) - 0.5;
  const maxKg = Math.max(...values) + 0.5;
  const x = (date: LocalDate) => padding + (daysBetween(from, date) / (days - 1)) * (width - 2 * padding);
  const y = (kg: number) => padding + ((maxKg - kg) / (maxKg - minKg)) * (height - 2 * padding);

  return {
    raw: raw.map((w) => ({ date: w.date, x: x(w.date), y: y(w.kg) })),
    average: average.map((w) => `${x(w.date)},${y(w.kg)}`).join(' '),
    minKg,
    maxKg,
  };
}
