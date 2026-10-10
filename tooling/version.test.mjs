import { describe, expect, it } from 'vitest';
import { versionFromTag } from './version.mjs';

describe('versionFromTag', () => {
  it('turns a release tag into versionName and versionCode', () => {
    expect(versionFromTag('v1.2.3')).toEqual({ name: '1.2.3', code: 10203 });
    expect(versionFromTag('v1.0.0')).toEqual({ name: '1.0.0', code: 10000 });
  });

  it('keeps versionCode increasing across minor and patch bumps', () => {
    const codes = ['v1.0.9', 'v1.0.10', 'v1.1.0', 'v1.99.99', 'v2.0.0'].map((t) => versionFromTag(t).code);
    expect([...codes].sort((a, b) => a - b)).toEqual(codes);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('rejects tags that are not vMAJOR.MINOR.PATCH', () => {
    for (const tag of ['1.2.3', 'v1.2', 'v1.2.3-beta', 'release-1', '']) {
      expect(() => versionFromTag(tag)).toThrow('Release tags look like v1.2.3');
    }
  });

  it('rejects minor or patch of 100 or more, which would break ordering', () => {
    expect(() => versionFromTag('v1.100.0')).toThrow('below 100');
    expect(() => versionFromTag('v1.0.100')).toThrow('below 100');
  });

  it('rejects v0.0.0, because Android needs a versionCode above 0', () => {
    expect(() => versionFromTag('v0.0.0')).toThrow('above 0');
  });
});
