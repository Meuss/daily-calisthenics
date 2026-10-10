import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { expect, it } from 'vitest';

const DOMAIN_DIR = resolve('src/domain');
const FORBIDDEN_IMPORT = /from\s+['"](react|react-native|expo[^'"]*|@react-native[^'"]*)['"]/;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return path.endsWith('.ts') ? [path] : [];
  });
}

it('domain code does not import React, React Native or Expo', () => {
  const offenders = sourceFiles(DOMAIN_DIR).filter((file) => FORBIDDEN_IMPORT.test(readFileSync(file, 'utf8')));
  expect(offenders).toEqual([]);
});
