// Turns a release tag into the Android versionName/versionCode. Used by .github/workflows/release.yml.
import { fileURLToPath } from 'node:url';

/** 'v1.2.3' → { name: '1.2.3', code: 10203 }. Minor and patch stay below 100 so codes always increase. */
export function versionFromTag(tag) {
  const match = /^v(\d+)\.(\d+)\.(\d+)$/.exec(tag);
  if (!match) throw new Error(`Release tags look like v1.2.3, got "${tag}"`);
  const [major, minor, patch] = match.slice(1).map(Number);
  if (minor > 99 || patch > 99) throw new Error(`Minor and patch must be below 100, got "${tag}"`);
  const code = major * 10000 + minor * 100 + patch;
  if (code === 0) throw new Error('versionCode must be above 0; start at v0.0.1 or v1.0.0');
  return { name: `${major}.${minor}.${patch}`, code };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { name, code } = versionFromTag(process.argv[2] ?? '');
  console.log(`APP_VERSION=${name}`);
  console.log(`APP_VERSION_CODE=${code}`);
}
