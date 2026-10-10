import {
  placementLevels,
  roundKg,
  toLocalDate,
  validateWeighIn,
  type Adjustment,
  type AppSettings,
  type DomainEvent,
  type EventOf,
  type LocalDate,
  type PlacementAnswers,
  type RotationRoutineId,
} from '../domain';

export function hasPlacement(events: DomainEvent[]): boolean {
  return events.some((event) => event.type === 'placementCompleted');
}

/** Placement also records the Freeze settings in force, so the Streak never depends on a changeable default. */
export function placementEvents(answers: PlacementAnswers, rotationStart: RotationRoutineId, settings: AppSettings, now: Date): DomainEvent[] {
  const at = now.toISOString();
  const date = toLocalDate(now);
  return [
    { type: 'placementCompleted', at, date, levels: placementLevels(answers), rotationStart },
    { type: 'freezePolicySet', at, date, policy: settings.freeze },
  ];
}

export function settingsChangeEvents(previous: AppSettings, next: AppSettings, now: Date): DomainEvent[] {
  if (JSON.stringify(previous.freeze) === JSON.stringify(next.freeze)) return [];
  return [{ type: 'freezePolicySet', at: now.toISOString(), date: toLocalDate(now), policy: next.freeze }];
}

export type WeighInResult = { ok: true; event: EventOf<'weighInRecorded'> } | { ok: false; error: string };

export function weighInEvent(date: LocalDate, kgInput: string, now: Date): WeighInResult {
  const trimmed = kgInput.trim().replace(',', '.');
  const kg = trimmed === '' ? Number.NaN : roundKg(Number(trimmed));
  const error = validateWeighIn(date, kg, toLocalDate(now));
  if (error) return { ok: false, error };
  return { ok: true, event: { type: 'weighInRecorded', at: now.toISOString(), date, kg } };
}

export function weighInDeletedEvent(date: LocalDate, now: Date): EventOf<'weighInDeleted'> {
  return { type: 'weighInDeleted', at: now.toISOString(), date };
}

export function adjustmentDecisionEvent(adjustment: Adjustment, accept: boolean, now: Date): DomainEvent {
  const at = now.toISOString();
  const date = toLocalDate(now);
  return accept
    ? { type: 'adjustmentAccepted', at, date, progression: adjustment.progression, from: adjustment.from, to: adjustment.to }
    : { type: 'adjustmentDismissed', at, date, progression: adjustment.progression };
}
