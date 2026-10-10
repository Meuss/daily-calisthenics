import { openDatabaseSync } from 'expo-sqlite';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { toLocalDate, type AppSettings, type DomainEvent, type LocalDate } from '../domain';
import { settingsChangeEvents } from './commands';
import type { EventStore } from './eventStore';
import type { KeyValueStore } from './kvStore';
import { loadSettings, saveSettings } from './settingsStore';
import { createSqliteEventStore } from './sqliteEventStore';
import { sqliteKeyValueStore } from './sqliteKv';
import { syncReminders } from '../notifications/notifier';
import { reminderPlan } from '../notifications/schedule';

export type AppData = {
  events: DomainEvent[];
  settings: AppSettings;
  today: LocalDate;
  kv: KeyValueStore;
  append: (events: DomainEvent[]) => void;
  updateSettings: (next: AppSettings) => void;
  replaceAll: (events: DomainEvent[], settings: AppSettings) => void;
};

const AppDataContext = createContext<AppData | null>(null);

let stores: { events: EventStore; kv: KeyValueStore } | undefined;

function getStores() {
  stores ??= { events: createSqliteEventStore(openDatabaseSync('calisthenics.db')), kv: sqliteKeyValueStore };
  return stores;
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { events: eventStore, kv } = getStores();
  const [events, setEvents] = useState(() => eventStore.all());
  const [settings, setSettings] = useState(() => loadSettings(kv));
  // Latest settings, readable before a re-render, so back-to-back updates diff against the current base.
  const settingsRef = useRef(settings);
  const [today, setToday] = useState(() => toLocalDate(new Date()));

  // "Today" rolls over at local midnight, and when the app comes back to the foreground.
  useEffect(() => {
    const refresh = () => setToday(toLocalDate(new Date()));
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    const timer = setInterval(refresh, 60_000);
    return () => {
      subscription.remove();
      clearInterval(timer);
    };
  }, []);

  const doneToday = useMemo(() => events.some((e) => e.type === 'sessionFinished' && e.date === today), [events, today]);

  // Re-plan Reminders on launch, at midnight, after a Session and when Reminder settings change.
  useEffect(() => {
    syncReminders(reminderPlan(settings.reminder, doneToday, new Date())).catch((error) => console.warn('Could not schedule Reminders', error));
  }, [settings.reminder, doneToday, today]);

  const append = useCallback(
    (newEvents: DomainEvent[]) => {
      if (newEvents.length === 0) return;
      eventStore.append(newEvents);
      setEvents(eventStore.all());
    },
    [eventStore],
  );

  const updateSettings = useCallback(
    (next: AppSettings) => {
      append(settingsChangeEvents(settingsRef.current, next, new Date()));
      saveSettings(kv, next);
      settingsRef.current = next;
      setSettings(next);
    },
    [append, kv],
  );

  const replaceAll = useCallback(
    (nextEvents: DomainEvent[], nextSettings: AppSettings) => {
      eventStore.replaceAll(nextEvents);
      saveSettings(kv, nextSettings);
      settingsRef.current = nextSettings;
      setEvents(eventStore.all());
      setSettings(nextSettings);
    },
    [eventStore, kv],
  );

  const value = useMemo(
    () => ({ events, settings, today, kv, append, updateSettings, replaceAll }),
    [events, settings, today, kv, append, updateSettings, replaceAll],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppData {
  const value = useContext(AppDataContext);
  if (!value) throw new Error('useAppData must be used inside AppDataProvider');
  return value;
}
