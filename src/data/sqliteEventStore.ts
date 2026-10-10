import type { SQLiteDatabase } from 'expo-sqlite';
import { DomainEventSchema, type DomainEvent } from '../domain';
import type { EventStore } from './eventStore';

export function createSqliteEventStore(db: SQLiteDatabase): EventStore {
  db.execSync('CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, json TEXT NOT NULL);');

  const insertAll = (events: DomainEvent[]) => {
    for (const event of events) db.runSync('INSERT INTO events (json) VALUES (?)', [JSON.stringify(event)]);
  };

  return {
    all() {
      return db.getAllSync<{ json: string }>('SELECT json FROM events ORDER BY id').flatMap(({ json }) => {
        const parsed = DomainEventSchema.safeParse(JSON.parse(json));
        if (!parsed.success) console.warn('Skipping an unreadable event', json);
        return parsed.success ? [parsed.data] : [];
      });
    },
    append(events) {
      db.withTransactionSync(() => insertAll(events));
    },
    replaceAll(events) {
      db.withTransactionSync(() => {
        db.runSync('DELETE FROM events');
        insertAll(events);
      });
    },
  };
}
