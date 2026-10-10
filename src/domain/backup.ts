import { z } from 'zod';
import { lastStep } from './catalog/progressions';
import type { LocalDate } from './dates';
import { DomainEventSchema, type DomainEvent } from './events';
import type { ProgressionId, ProgressionLevel } from './primitives';
import { AppSettingsSchema, type AppSettings } from './settings';

export const BACKUP_APP = 'daily-calisthenics';
export const BACKUP_VERSION = 1;

const BackupSchema = z.object({
  app: z.literal(BACKUP_APP),
  version: z.literal(BACKUP_VERSION),
  exportedAt: z.string(),
  settings: AppSettingsSchema,
  events: z.array(DomainEventSchema),
});

export type Backup = z.infer<typeof BackupSchema>;
export type ParseBackupResult = { ok: true; backup: Backup } | { ok: false; error: string };

export function serializeBackup(settings: AppSettings, events: DomainEvent[], exportedAt: Date): string {
  const backup: Backup = { app: BACKUP_APP, version: BACKUP_VERSION, exportedAt: exportedAt.toISOString(), settings, events };
  return JSON.stringify(backup, null, 2);
}

/** Problems the schema can't see: future days and Progression Steps missing from the catalog. */
function semanticError(events: DomainEvent[], today: LocalDate): string | null {
  const badStep = (progression: ProgressionId, level: ProgressionLevel) => level.step > lastStep(progression);
  for (const [i, event] of events.entries()) {
    const at = `Invalid backup at events.${i}`;
    if (event.date > today) return `${at}.date: ${event.date} is in the future.`;
    if (event.type === 'placementCompleted') {
      for (const [progression, level] of Object.entries(event.levels) as [ProgressionId, ProgressionLevel][]) {
        if (badStep(progression, level)) return `${at}.levels.${progression}.step: ${progression} has no step ${level.step}.`;
      }
    }
    if (event.type === 'adjustmentAccepted') {
      for (const key of ['from', 'to'] as const) {
        if (badStep(event.progression, event[key])) return `${at}.${key}.step: ${event.progression} has no step ${event[key].step}.`;
      }
    }
  }
  return null;
}

/** Validates the whole file before returning anything, so an import is all-or-nothing. */
export function parseBackup(text: string, today: LocalDate): ParseBackupResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Not a valid JSON file.' };
  }

  const header = (typeof raw === 'object' && raw !== null ? raw : {}) as { app?: unknown; version?: unknown };
  if (header.app !== BACKUP_APP) return { ok: false, error: 'Not a Daily Calisthenics backup.' };
  if (header.version !== BACKUP_VERSION) return { ok: false, error: `Unsupported backup version: ${String(header.version)}.` };

  const parsed = BackupSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: `Invalid backup at ${issue.path.map(String).join('.')}: ${issue.message}` };
  }
  const error = semanticError(parsed.data.events, today);
  if (error) return { ok: false, error };
  return { ok: true, backup: parsed.data };
}

export function backupFileName(today: LocalDate): string {
  return `daily-calisthenics-backup-${today}.json`;
}
