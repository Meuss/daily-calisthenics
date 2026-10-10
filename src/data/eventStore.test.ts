import { describe, expect, it } from 'vitest';
import { session, weighIn } from '../domain/testing/builders';
import { createMemoryEventStore } from './eventStore';

describe('createMemoryEventStore', () => {
  it('keeps events in the order they were appended', () => {
    const store = createMemoryEventStore();
    store.append([session('2026-10-05')]);
    store.append([weighIn('2026-10-05', 80), session('2026-10-06')]);
    expect(store.all().map((e) => e.date)).toEqual(['2026-10-05', '2026-10-05', '2026-10-06']);
  });

  it('returns a copy that callers cannot mutate', () => {
    const store = createMemoryEventStore([session('2026-10-05')]);
    store.all().pop();
    expect(store.all()).toHaveLength(1);
  });

  it('replaces the whole log', () => {
    const store = createMemoryEventStore([session('2026-10-05')]);
    store.replaceAll([]);
    expect(store.all()).toEqual([]);
  });
});
