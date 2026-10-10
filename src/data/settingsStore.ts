import { AppSettingsSchema, DEFAULT_SETTINGS, type AppSettings } from '../domain';
import type { KeyValueStore } from './kvStore';

const SETTINGS_KEY = 'settings';

/** Corrupt or outdated settings fall back to the defaults rather than crashing at launch. */
export function loadSettings(kv: KeyValueStore): AppSettings {
  const raw = kv.get(SETTINGS_KEY);
  if (raw === null) return DEFAULT_SETTINGS;
  try {
    const parsed = AppSettingsSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(kv: KeyValueStore, settings: AppSettings): void {
  kv.set(SETTINGS_KEY, JSON.stringify(settings));
}
