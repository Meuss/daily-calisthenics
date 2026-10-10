import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../domain';
import { createMemoryKeyValueStore } from './kvStore';
import { loadSettings, saveSettings } from './settingsStore';

describe('settings storage', () => {
  it('uses the defaults on first launch', () => {
    expect(loadSettings(createMemoryKeyValueStore())).toEqual(DEFAULT_SETTINGS);
  });

  it('round-trips saved settings', () => {
    const kv = createMemoryKeyValueStore();
    const settings = { ...DEFAULT_SETTINGS, weighInPromptAfterSession: false };
    saveSettings(kv, settings);
    expect(loadSettings(kv)).toEqual(settings);
  });

  it('falls back to the defaults when the stored value is corrupt or outdated', () => {
    const kv = createMemoryKeyValueStore();
    kv.set('settings', '{not json');
    expect(loadSettings(kv)).toEqual(DEFAULT_SETTINGS);
    kv.set('settings', JSON.stringify({ reminder: { enabled: true } }));
    expect(loadSettings(kv)).toEqual(DEFAULT_SETTINGS);
  });
});
