import { addDays, daysBetween, movingAverage7, type LocalDate, type WeighIn } from '../domain';

export const CHART_DAYS = 60;
/** The window never gets shorter than this, so a first week of Weigh-ins isn't stretched edge to edge. */
export const MIN_CHART_DAYS = 14;

export type ChartPoint = { date: LocalDate; x: number; y: number };
export type ChartGeometry = { raw: ChartPoint[]; average: string; minKg: number; maxKg: number };

/**
 * Raw Weigh-ins as dots and the 7-day average as a line, over at most `maxDays` ending today.
 * The window starts at the first Weigh-in inside it (at least MIN_CHART_DAYS long), so sparse early data still fills the chart.
 */
export function chartGeometry(weighIns: WeighIn[], today: LocalDate, maxDays: number, width: number, height: number, padding = 16): ChartGeometry | null {
  const earliest = addDays(today, -(maxDays - 1));
  const first = weighIns.find((w) => w.date >= earliest && w.date <= today)?.date;
  if (first === undefined) return null;
  const days = Math.min(maxDays, Math.max(MIN_CHART_DAYS, daysBetween(first, today) + 1));
  const from = addDays(today, -(days - 1));
  const inWindow = (w: WeighIn) => w.date >= from && w.date <= today;
  const raw = weighIns.filter(inWindow);

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
