import type { DomainEvent } from '../domain';

/** The append-only event log (ADR 0001). */
export interface EventStore {
  all(): DomainEvent[];
  append(events: DomainEvent[]): void;
  replaceAll(events: DomainEvent[]): void;
}

export function createMemoryEventStore(initial: DomainEvent[] = []): EventStore {
  let log = [...initial];
  return {
    all: () => [...log],
    append: (events) => {
      log = [...log, ...events];
    },
    replaceAll: (events) => {
      log = [...events];
    },
  };
}
