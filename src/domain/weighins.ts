import { addDays, type LocalDate } from './dates';
import type { DomainEvent } from './events';

export type WeighIn = { date: LocalDate; kg: number };

export const MIN_KG = 20;
export const MAX_KG = 400;

export function roundKg(kg: number): number {
  return Math.round(kg * 10) / 10;
}

/** One Weigh-in per day: the latest recorded entry wins, a deletion removes it. */
export function deriveWeighIns(events: DomainEvent[]): WeighIn[] {
  const byDate = new Map<LocalDate, number>();
  for (const event of events) {
    if (event.type === 'weighInRecorded') byDate.set(event.date, event.kg);
    if (event.type === 'weighInDeleted') byDate.delete(event.date);
  }
  return [...byDate]
    .map(([date, kg]) => ({ date, kg }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

export function movingAverage7(weighIns: WeighIn[]): WeighIn[] {
  return weighIns.map(({ date }) => {
    const from = addDays(date, -6);
    const window = weighIns.filter((w) => w.date >= from && w.date <= date);
    return { date, kg: roundKg(window.reduce((sum, w) => sum + w.kg, 0) / window.length) };
  });
}

export function validateWeighIn(date: LocalDate, kg: number, today: LocalDate): string | null {
  if (date > today) return 'A Weigh-in cannot be in the future.';
  if (!Number.isFinite(kg) || kg < MIN_KG || kg > MAX_KG) return `Weight must be between ${MIN_KG} and ${MAX_KG} kg.`;
  return null;
}
