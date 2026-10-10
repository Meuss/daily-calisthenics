import { describe, expect, it } from 'vitest';
import { backupFileName, parseBackup, serializeBackup } from './backup';
import { DEFAULT_SETTINGS } from './settings';
import { placement, rating, session, weighIn } from './testing/builders';

const events = [placement('2026-10-05'), session('2026-10-05'), rating('2026-10-05', 'push', 'ok'), weighIn('2026-10-05', 82.3)];
const exportedAt = new Date('2026-10-10T08:00:00.000Z');

describe('backup', () => {
  it('round-trips settings and events', () => {
    const result = parseBackup(serializeBackup(DEFAULT_SETTINGS, events, exportedAt));
    expect(result).toEqual({
      ok: true,
      backup: { app: 'daily-calisthenics', version: 1, exportedAt: '2026-10-10T08:00:00.000Z', settings: DEFAULT_SETTINGS, events },
    });
  });

  it('rejects text that is not JSON', () => {
    expect(parseBackup('not json')).toEqual({ ok: false, error: 'Not a valid JSON file.' });
  });

  it('rejects JSON from another app', () => {
    expect(parseBackup(JSON.stringify({ hello: 'world' }))).toEqual({ ok: false, error: 'Not a Daily Calisthenics backup.' });
  });

  it('rejects a backup from a newer version of the app', () => {
    const future = { ...JSON.parse(serializeBackup(DEFAULT_SETTINGS, events, exportedAt)), version: 2 };
    expect(parseBackup(JSON.stringify(future))).toEqual({ ok: false, error: 'Unsupported backup version: 2.' });
  });

  it('rejects a backup with a broken event and says where', () => {
    const broken = JSON.parse(serializeBackup(DEFAULT_SETTINGS, events, exportedAt));
    broken.events[3].kg = 'heavy';
    const result = parseBackup(JSON.stringify(broken));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/^Invalid backup at events\.3\.kg/);
  });

  it('names export files so .gitignore keeps them out of the repo', () => {
    expect(backupFileName('2026-10-10')).toBe('daily-calisthenics-backup-2026-10-10.json');
  });
});
