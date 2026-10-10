import Storage from 'expo-sqlite/kv-store';
import type { KeyValueStore } from './kvStore';

export const sqliteKeyValueStore: KeyValueStore = {
  get: (key) => Storage.getItemSync(key),
  set: (key, value) => Storage.setItemSync(key, value),
  remove: (key) => {
    Storage.removeItemSync(key);
  },
};
