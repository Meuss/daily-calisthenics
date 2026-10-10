import { z } from 'zod';
import type { LocalDate } from './dates';
import { DomainEventSchema, type DomainEvent } from './events';
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

/** Validates the whole file before returning anything, so an import is all-or-nothing. */
export function parseBackup(text: string): ParseBackupResult {
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
  return { ok: true, backup: parsed.data };
}

export function backupFileName(today: LocalDate): string {
  return `daily-calisthenics-backup-${today}.json`;
}
