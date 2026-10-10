# Daily Calisthenics — Plan 1: Domain Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the Expo project and build the pure, fully tested TypeScript domain module that holds every rule of the app (catalog, Placement, Progression levels, Adjustments, Rotation, Session plans, Streak & Freezes, Weigh-ins, Achievements, backup).

**Architecture:** `src/domain/` is plain TypeScript with no React/Expo imports. The app's single source of truth is an append-only list of `DomainEvent`s (ADR 0001); every derived value (levels, Streak, Rotation, Achievements…) is a pure function of `(events, today)`. Zod schemas define events and settings once and give us both types and import validation.

**Tech Stack:** Expo (blank-typescript template), TypeScript (strict), Zod 4, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-10-daily-calisthenics-design.md` (vocabulary in `CONTEXT.md`, decision in `docs/adr/0001-derive-streak-from-event-log.md`).

This is plan 1 of 3. Plan 2 (app: storage, screens, Session player, notifications, illustrations) and Plan 3 (GitHub Actions APK release) build on the interfaces produced here.

## Global Constraints

- Nothing under `src/domain/` may import `react`, `react-native`, `expo*` or `@react-native*` (enforced by `src/domain/purity.test.ts`).
- Domain functions never read the clock: "today" is a `LocalDate` parameter (`'YYYY-MM-DD'`, device-local calendar day), instants are passed in as `Date`.
- Display name `Daily Calisthenics`, slug `daily-calisthenics`, Android package `com.meuss.calisthenics`, `userInterfaceStyle: "dark"`.
- v1 is kg only, dark only, English only.
- Use the glossary terms from `CONTEXT.md` in identifiers and user-facing strings (Routine, Session, Slot, Round, Target, Hold, Progression, Step, Rating, Adjustment, Placement, Weigh-in, Streak, Freeze, Achievement, Comeback, Reminder).
- Zod major version 4 (`zod@^4`).
- Export files are named `daily-calisthenics-backup-YYYY-MM-DD.json` and are git-ignored.

## Review Focus

1. **Two Sessions on the same day** (Short Routine in the morning, full Routine later): the Streak counts the day once, the Rotation advances only for the full Routine, the Sessions total counts both. → tests in Tasks 5, 6, 8.
2. **Changing Freeze settings mid-week** must not rewrite past days; it applies from the next Monday, except on the very first day of use. → tests in Task 6.
3. **Importing a broken, foreign or future-version backup** must be rejected with a readable message, never partially applied. → tests in Task 9.
4. **Long absence**: Freezes run out, the Streak resets, and Freezes are not burned while there is no Streak to protect. → tests in Task 6.
5. **Date arithmetic across DST changes and local midnight** must never skip or double a day. → tests in Task 1.

---

## File Structure

```
.gitignore                      (modify: backups, native dirs)
LICENSE                         MIT
README.md                       what it is, how to run tests
app.json                        (modify: name, package, dark)
package.json                    (modify: scripts)
vitest.config.ts                test config
src/domain/
  dates.ts                      LocalDate arithmetic
  primitives.ts                 enum/level/date Zod schemas shared by everything
  settings.ts                   AppSettings schema + defaults
  events.ts                     DomainEvent schema + types
  catalog/exercises.ts          the Exercise library (order = Progression steps)
  catalog/progressions.ts       Progressions, exerciseFor, defaultLevels
  catalog/routines.ts           Routines, Rotation, Short Routine
  catalog/warmup.ts             Warm-up moves
  progression.ts                deriveLevels
  placement.ts                  placementLevels
  adjustments.ts                nextLevel, pendingAdjustments
  rotation.ts                   nextRoutineId
  sessionPlan.ts                buildSessionPlan, estimateSeconds
  streak.ts                     computeStreak
  weighins.ts                   deriveWeighIns, movingAverage7, validateWeighIn
  achievements.ts               ACHIEVEMENTS, earnedAchievements, newlyEarned
  backup.ts                     serializeBackup, parseBackup, backupFileName
  index.ts                      public barrel
  testing/builders.ts           event builders for tests only
  *.test.ts                     colocated tests
```

---

### Task 1: Project scaffold and date arithmetic

**Files:**
- Create: Expo scaffold files (`App.tsx`, `index.ts`, `app.json`, `package.json`, `tsconfig.json`, `assets/`), `vitest.config.ts`, `LICENSE`, `README.md`, `src/domain/dates.ts`, `src/domain/dates.test.ts`, `src/domain/purity.test.ts`
- Modify: `.gitignore`, `app.json`, `package.json`

**Interfaces:**
- Consumes: nothing.
- Produces (`src/domain/dates.ts`):
  - `type LocalDate = string`
  - `addDays(date: LocalDate, days: number): LocalDate`
  - `daysBetween(from: LocalDate, to: LocalDate): number`
  - `isMonday(date: LocalDate): boolean`
  - `mondayOf(date: LocalDate): LocalDate`
  - `eachDay(from: LocalDate, to: LocalDate): LocalDate[]` (inclusive)
  - `toLocalDate(instant: Date): LocalDate`
  - npm scripts `test` (`vitest run`) and `typecheck` (`tsc --noEmit`).

- [ ] **Step 1: Initialise git and scaffold Expo into the existing folder**

The folder already contains `CONTEXT.md` and `docs/`, so scaffold into a temp subfolder and move it up.

```bash
cd /Users/thomas/web/perso/side-projects/my-calisthenics
git init -b main
npx create-expo-app@latest expo-scaffold --template blank-typescript --no-install
rsync -a --exclude .git expo-scaffold/ ./
rm -rf expo-scaffold
npm install
npm install zod@^4
npm install -D vitest @types/node
```

Expected: `package.json`, `App.tsx`, `app.json`, `tsconfig.json` exist at the root; `npm ls zod vitest` shows both.

- [ ] **Step 2: Configure app identity, scripts, Vitest, ignore rules, license**

```bash
node -e '
const fs = require("fs");
const config = JSON.parse(fs.readFileSync("app.json", "utf8"));
config.expo.name = "Daily Calisthenics";
config.expo.slug = "daily-calisthenics";
config.expo.orientation = "portrait";
config.expo.userInterfaceStyle = "dark";
config.expo.android = { ...(config.expo.android || {}), package: "com.meuss.calisthenics" };
fs.writeFileSync("app.json", JSON.stringify(config, null, 2) + "\n");
'
npm pkg set scripts.test="vitest run" scripts.typecheck="tsc --noEmit"
cat >> .gitignore <<'EOF'

# Personal data exported from the app — never commit
daily-calisthenics-backup-*.json

# Generated native projects (EAS prebuild)
/android
/ios
EOF
```

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
  },
});
```

Create `LICENSE`:

```
MIT License

Copyright (c) 2026 Meuss

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

Create `README.md`:

```md
# Daily Calisthenics

A small Android app for a ~12-minute bodyweight routine every morning, a daily Weigh-in, and a Streak that forgives the occasional bad day. All data stays on your phone.

- Vocabulary: [`CONTEXT.md`](CONTEXT.md)
- Design: [`docs/superpowers/specs/2026-10-10-daily-calisthenics-design.md`](docs/superpowers/specs/2026-10-10-daily-calisthenics-design.md)

## Development

    npm install
    npm test          # domain unit tests
    npm run typecheck

## License

MIT
```

- [ ] **Step 3: Write the failing date tests**

Create `src/domain/dates.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { addDays, daysBetween, eachDay, isMonday, mondayOf, toLocalDate } from './dates';

describe('addDays', () => {
  it('crosses month and year boundaries', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('never skips or doubles a day across daylight-saving changes', () => {
    expect(addDays('2026-03-28', 1)).toBe('2026-03-29');
    expect(addDays('2026-03-29', 1)).toBe('2026-03-30');
    expect(addDays('2026-10-24', 2)).toBe('2026-10-26');
    expect(eachDay('2026-03-27', '2026-03-31')).toHaveLength(5);
  });
});

describe('daysBetween', () => {
  it('counts calendar days in either direction', () => {
    expect(daysBetween('2026-10-01', '2026-10-10')).toBe(9);
    expect(daysBetween('2026-10-10', '2026-10-01')).toBe(-9);
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2);
  });
});

describe('mondayOf / isMonday', () => {
  it('finds the Monday that starts the week', () => {
    expect(mondayOf('2026-10-10')).toBe('2026-10-05'); // Saturday
    expect(mondayOf('2026-10-11')).toBe('2026-10-05'); // Sunday belongs to the previous week
    expect(mondayOf('2026-10-05')).toBe('2026-10-05');
    expect(mondayOf('2026-10-12')).toBe('2026-10-12');
  });

  it('recognises Mondays', () => {
    expect(isMonday('2026-10-05')).toBe(true);
    expect(isMonday('2026-10-10')).toBe(false);
  });
});

describe('eachDay', () => {
  it('lists every day inclusively', () => {
    expect(eachDay('2026-09-29', '2026-10-02')).toEqual(['2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02']);
  });

  it('is empty when the range is reversed', () => {
    expect(eachDay('2026-10-02', '2026-10-01')).toEqual([]);
  });
});

describe('toLocalDate', () => {
  it('uses the device-local calendar day, including just after midnight', () => {
    expect(toLocalDate(new Date(2026, 9, 10, 0, 30))).toBe('2026-10-10');
    expect(toLocalDate(new Date(2026, 9, 10, 23, 59))).toBe('2026-10-10');
  });
});
```

- [ ] **Step 4: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `Failed to resolve import "./dates"`.

- [ ] **Step 5: Implement `src/domain/dates.ts`**

```ts
/** A device-local calendar day, formatted 'YYYY-MM-DD'. ISO strings compare correctly with < and >. */
export type LocalDate = string;

const MS_PER_DAY = 86_400_000;

// Arithmetic is done on UTC midnights so daylight-saving changes can never shift a day.
function toUtcMs(date: LocalDate): number {
  const [year, month, day] = date.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

function fromUtcMs(ms: number): LocalDate {
  return new Date(ms).toISOString().slice(0, 10);
}

export function addDays(date: LocalDate, days: number): LocalDate {
  return fromUtcMs(toUtcMs(date) + days * MS_PER_DAY);
}

export function daysBetween(from: LocalDate, to: LocalDate): number {
  return Math.round((toUtcMs(to) - toUtcMs(from)) / MS_PER_DAY);
}

export function isMonday(date: LocalDate): boolean {
  return new Date(toUtcMs(date)).getUTCDay() === 1;
}

export function mondayOf(date: LocalDate): LocalDate {
  const dayOfWeek = new Date(toUtcMs(date)).getUTCDay(); // 0 = Sunday
  return addDays(date, -((dayOfWeek + 6) % 7));
}

export function eachDay(from: LocalDate, to: LocalDate): LocalDate[] {
  const days: LocalDate[] = [];
  for (let date = from; date <= to; date = addDays(date, 1)) days.push(date);
  return days;
}

export function toLocalDate(instant: Date): LocalDate {
  const year = instant.getFullYear();
  const month = String(instant.getMonth() + 1).padStart(2, '0');
  const day = String(instant.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
```

- [ ] **Step 6: Add the domain purity guard**

Create `src/domain/purity.test.ts`:

```ts
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
```

- [ ] **Step 7: Run tests and typecheck**

Run: `npm test && npm run typecheck`
Expected: all tests PASS, typecheck exits 0.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: scaffold Expo app with Vitest and date arithmetic"
```

---

### Task 2: Primitives, settings, events and the training catalog

**Files:**
- Create: `src/domain/primitives.ts`, `src/domain/settings.ts`, `src/domain/events.ts`, `src/domain/catalog/exercises.ts`, `src/domain/catalog/progressions.ts`, `src/domain/catalog/routines.ts`, `src/domain/catalog/warmup.ts`, `src/domain/testing/builders.ts`
- Test: `src/domain/catalog/catalog.test.ts`, `src/domain/events.test.ts`

**Interfaces:**
- Consumes: `LocalDate` from `dates.ts`.
- Produces:
  - `primitives.ts`: `ProgressionIdSchema`, `type ProgressionId` (`'push'|'squat'|'hinge'|'lunge'|'coreHold'|'coreDynamic'|'back'`), `PROGRESSION_IDS`, `RoutineIdSchema`, `type RoutineId` (`'A'|'B'|'C'|'short'`), `RotationRoutineIdSchema`, `type RotationRoutineId` (`'A'|'B'|'C'`), `RatingSchema`, `type Rating` (`'tooEasy'|'ok'|'tooHard'`), `LocalDateSchema`, `LevelSchema`, `LevelsSchema`, `type ProgressionLevel = { step: number; target: number }`, `type Levels = Record<ProgressionId, ProgressionLevel>`
  - `settings.ts`: `FreezePolicySchema`/`type FreezePolicy`, `AdjustmentRulesSchema`/`type AdjustmentRules`, `SessionSettingsSchema`/`type SessionSettings`, `ReminderSettingsSchema`/`type ReminderSettings`, `AppSettingsSchema`/`type AppSettings`, `DEFAULT_SETTINGS`
  - `events.ts`: `DomainEventSchema`, `type DomainEvent`, `type EventOf<T extends DomainEvent['type']>`
  - `catalog/exercises.ts`: `type ExerciseMode = 'reps'|'hold'`, `type Exercise`, `EXERCISE_LIST`, `EXERCISES`
  - `catalog/progressions.ts`: `type Progression`, `PROGRESSIONS`, `exerciseFor(progression, step): Exercise`, `lastStep(progression): number`, `defaultLevels(): Levels`
  - `catalog/routines.ts`: `type Routine`, `ROUTINES`, `ROTATION`, `SHORT_ROUTINE_ID`
  - `catalog/warmup.ts`: `type WarmupMove`, `WARMUP`
  - `testing/builders.ts`: `session`, `rating`, `weighIn`, `weighInDeleted`, `placement`, `accepted`, `dismissed`, `freezePolicy`

- [ ] **Step 1: Write the failing catalog and event tests**

Create `src/domain/catalog/catalog.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { PROGRESSION_IDS } from '../primitives';
import { DEFAULT_SETTINGS } from '../settings';
import { EXERCISE_LIST } from './exercises';
import { PROGRESSIONS, defaultLevels, exerciseFor, lastStep } from './progressions';
import { ROTATION, ROUTINES, SHORT_ROUTINE_ID } from './routines';
import { WARMUP } from './warmup';

const { repCeiling, holdCeiling } = DEFAULT_SETTINGS.adjustments;

describe('Exercise library', () => {
  it('has unique Exercise ids', () => {
    const ids = EXERCISE_LIST.map((exercise) => exercise.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives every Progression at least 3 steps that belong to it', () => {
    for (const id of PROGRESSION_IDS) {
      expect(PROGRESSIONS[id].steps.length).toBeGreaterThanOrEqual(3);
      for (let step = 0; step <= lastStep(id); step++) expect(exerciseFor(id, step).progression).toBe(id);
    }
  });

  it('starts every Exercise below its ceiling so it can be progressed', () => {
    for (const exercise of EXERCISE_LIST) {
      const ceiling = exercise.mode === 'reps' ? repCeiling : holdCeiling;
      expect(exercise.startTarget).toBeLessThan(ceiling);
      expect(exercise.cues.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('throws on a step outside the Progression', () => {
    expect(() => exerciseFor('push', 99)).toThrow('No step 99 in Progression push');
  });

  it('starts every Progression at step 0 with its start Target by default', () => {
    const levels = defaultLevels();
    expect(levels.push).toEqual({ step: 0, target: exerciseFor('push', 0).startTarget });
    expect(Object.keys(levels).sort()).toEqual([...PROGRESSION_IDS].sort());
  });
});

describe('Routines', () => {
  it('fills full Routines with 4 Slots × 3 Rounds and a Warm-up', () => {
    for (const id of ROTATION) {
      expect(ROUTINES[id].slots).toHaveLength(4);
      expect(ROUTINES[id].rounds).toBe(3);
      expect(ROUTINES[id].warmup).toBe(true);
    }
  });

  it('keeps the Short Routine to one Round without Warm-up and out of the Rotation', () => {
    const short = ROUTINES[SHORT_ROUTINE_ID];
    expect(short.rounds).toBe(1);
    expect(short.warmup).toBe(false);
    expect(ROTATION).not.toContain(SHORT_ROUTINE_ID);
  });

  it('only names known Progressions in Slots', () => {
    for (const routine of Object.values(ROUTINES)) {
      for (const slot of routine.slots) expect(PROGRESSION_IDS).toContain(slot);
    }
  });

  it('has a 90-second Warm-up', () => {
    expect(WARMUP.reduce((total, move) => total + move.seconds, 0)).toBe(90);
  });
});
```

Create `src/domain/events.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { DomainEventSchema } from './events';
import { AppSettingsSchema, DEFAULT_SETTINGS } from './settings';
import { accepted, dismissed, freezePolicy, placement, rating, session, weighIn, weighInDeleted } from './testing/builders';

describe('DomainEventSchema', () => {
  it('accepts every event the builders produce', () => {
    const events = [
      placement('2026-10-05'),
      session('2026-10-05'),
      rating('2026-10-05', 'push', 'tooEasy'),
      accepted('2026-10-06', 'push', { step: 2, target: 8 }, { step: 2, target: 10 }),
      dismissed('2026-10-06', 'squat'),
      weighIn('2026-10-05', 82.4),
      weighInDeleted('2026-10-05'),
      freezePolicy('2026-10-05', { perWeek: 2 }),
    ];
    for (const event of events) expect(DomainEventSchema.parse(event)).toEqual(event);
  });

  it('rejects an impossible Weigh-in', () => {
    expect(DomainEventSchema.safeParse(weighIn('2026-10-05', 5)).success).toBe(false);
  });

  it('rejects a date that is not YYYY-MM-DD', () => {
    expect(DomainEventSchema.safeParse({ ...session('2026-10-05'), date: '10/05/2026' }).success).toBe(false);
  });

  it('rejects an unknown event type', () => {
    expect(DomainEventSchema.safeParse({ type: 'somethingElse', at: 'x', date: '2026-10-05' }).success).toBe(false);
  });
});

describe('DEFAULT_SETTINGS', () => {
  it('is valid against its own schema', () => {
    expect(AppSettingsSchema.parse(DEFAULT_SETTINGS)).toEqual(DEFAULT_SETTINGS);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — unresolved imports `../primitives`, `./events`, etc.

- [ ] **Step 3: Implement `src/domain/primitives.ts`**

```ts
import { z } from 'zod';

export const ProgressionIdSchema = z.enum(['push', 'squat', 'hinge', 'lunge', 'coreHold', 'coreDynamic', 'back']);
export type ProgressionId = z.infer<typeof ProgressionIdSchema>;
export const PROGRESSION_IDS: readonly ProgressionId[] = ProgressionIdSchema.options;

export const RotationRoutineIdSchema = z.enum(['A', 'B', 'C']);
export type RotationRoutineId = z.infer<typeof RotationRoutineIdSchema>;

export const RoutineIdSchema = z.enum(['A', 'B', 'C', 'short']);
export type RoutineId = z.infer<typeof RoutineIdSchema>;

export const RatingSchema = z.enum(['tooEasy', 'ok', 'tooHard']);
export type Rating = z.infer<typeof RatingSchema>;

export const LocalDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected a YYYY-MM-DD date');

export const LevelSchema = z.object({
  step: z.number().int().min(0),
  target: z.number().int().min(1),
});
export type ProgressionLevel = { step: number; target: number };

export const LevelsSchema = z.record(ProgressionIdSchema, LevelSchema);
export type Levels = Record<ProgressionId, ProgressionLevel>;
```

- [ ] **Step 4: Implement `src/domain/settings.ts`**

```ts
import { z } from 'zod';

const TimeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Expected HH:MM');

export const ReminderSettingsSchema = z.object({
  enabled: z.boolean(),
  time: TimeSchema,
  nudgeEnabled: z.boolean(),
  nudgeTime: TimeSchema,
});
export type ReminderSettings = z.infer<typeof ReminderSettingsSchema>;

export const FreezePolicySchema = z.object({
  enabled: z.boolean(),
  perWeek: z.number().int().min(0).max(7),
  maxBanked: z.number().int().min(0).max(7),
});
export type FreezePolicy = z.infer<typeof FreezePolicySchema>;

export const AdjustmentRulesSchema = z.object({
  enabled: z.boolean(),
  ratingsInARow: z.number().int().min(1).max(10),
  repIncrement: z.number().int().min(1),
  holdIncrement: z.number().int().min(1),
  repCeiling: z.number().int().min(1),
  holdCeiling: z.number().int().min(1),
  repFloor: z.number().int().min(1),
  holdFloor: z.number().int().min(1),
});
export type AdjustmentRules = z.infer<typeof AdjustmentRulesSchema>;

export const SessionSettingsSchema = z.object({
  restSeconds: z.number().int().min(0).max(300),
  roundRestSeconds: z.number().int().min(0).max(600),
  warmupEnabled: z.boolean(),
  cue: z.enum(['beep', 'vibrate', 'both', 'none']),
  keepAwake: z.boolean(),
});
export type SessionSettings = z.infer<typeof SessionSettingsSchema>;

export const AppSettingsSchema = z.object({
  reminder: ReminderSettingsSchema,
  freeze: FreezePolicySchema,
  adjustments: AdjustmentRulesSchema,
  session: SessionSettingsSchema,
  weighInPromptAfterSession: z.boolean(),
});
export type AppSettings = z.infer<typeof AppSettingsSchema>;

export const DEFAULT_SETTINGS: AppSettings = {
  reminder: { enabled: true, time: '07:30', nudgeEnabled: true, nudgeTime: '09:00' },
  freeze: { enabled: true, perWeek: 1, maxBanked: 2 },
  adjustments: {
    enabled: true,
    ratingsInARow: 2,
    repIncrement: 2,
    holdIncrement: 5,
    repCeiling: 12,
    holdCeiling: 60,
    repFloor: 4,
    holdFloor: 10,
  },
  session: { restSeconds: 30, roundRestSeconds: 60, warmupEnabled: true, cue: 'both', keepAwake: true },
  weighInPromptAfterSession: true,
};
```

- [ ] **Step 5: Implement `src/domain/events.ts`**

```ts
import { z } from 'zod';
import {
  LevelSchema,
  LevelsSchema,
  LocalDateSchema,
  ProgressionIdSchema,
  RatingSchema,
  RotationRoutineIdSchema,
  RoutineIdSchema,
} from './primitives';
import { FreezePolicySchema } from './settings';

/**
 * Every event carries `at` (ISO instant it was recorded) and `date` (the local calendar day it applies to).
 * For a backfilled Weigh-in, `date` is the day the weight belongs to, not the day it was typed in.
 */
const base = { at: z.string().min(1), date: LocalDateSchema };

export const DomainEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('placementCompleted'), ...base, levels: LevelsSchema, rotationStart: RotationRoutineIdSchema }),
  z.object({ type: z.literal('sessionFinished'), ...base, routineId: RoutineIdSchema, skipped: z.array(ProgressionIdSchema) }),
  z.object({ type: z.literal('ratingGiven'), ...base, progression: ProgressionIdSchema, exerciseId: z.string().min(1), rating: RatingSchema }),
  z.object({ type: z.literal('adjustmentAccepted'), ...base, progression: ProgressionIdSchema, from: LevelSchema, to: LevelSchema }),
  z.object({ type: z.literal('adjustmentDismissed'), ...base, progression: ProgressionIdSchema }),
  z.object({ type: z.literal('weighInRecorded'), ...base, kg: z.number().min(20).max(400) }),
  z.object({ type: z.literal('weighInDeleted'), ...base }),
  z.object({ type: z.literal('freezePolicySet'), ...base, policy: FreezePolicySchema }),
]);

export type DomainEvent = z.infer<typeof DomainEventSchema>;
export type EventOf<T extends DomainEvent['type']> = Extract<DomainEvent, { type: T }>;
```

- [ ] **Step 6: Implement `src/domain/catalog/exercises.ts`**

The order of Exercises within a Progression **is** the step order.

```ts
import type { ProgressionId } from '../primitives';

export type ExerciseMode = 'reps' | 'hold';

export type Exercise = {
  id: string;
  name: string;
  progression: ProgressionId;
  mode: ExerciseMode;
  /** Target (reps, or seconds for a Hold) when the user first reaches this step. */
  startTarget: number;
  cues: string[];
};

export const EXERCISE_LIST: Exercise[] = [
  // Push
  { id: 'wall-push-up', name: 'Wall push-up', progression: 'push', mode: 'reps', startTarget: 10, cues: ['Hands on the wall at shoulder height, a bit wider than your shoulders', 'Body straight from head to heels', 'Bend your elbows until your nose nearly touches the wall, then push back'] },
  { id: 'incline-push-up', name: 'Incline push-up', progression: 'push', mode: 'reps', startTarget: 8, cues: ['Hands on the edge of a sofa, bed or sturdy chair', 'Body in one straight line, core tight', 'Lower your chest to the edge, then push away'] },
  { id: 'knee-push-up', name: 'Knee push-up', progression: 'push', mode: 'reps', startTarget: 6, cues: ['Knees on the floor, hands under your shoulders', 'Straight line from knees to head, no sagging hips', "Lower your chest to a fist's height above the floor, then press up"] },
  { id: 'push-up', name: 'Push-up', progression: 'push', mode: 'reps', startTarget: 5, cues: ['Hands under your shoulders, legs straight, on your toes', 'Squeeze glutes and abs so your body stays rigid', 'Lower until your chest nearly touches, elbows at about 45°, then press up'] },
  { id: 'wide-push-up', name: 'Wide push-up', progression: 'push', mode: 'reps', startTarget: 5, cues: ['Hands wider than your shoulders', 'Body straight, core tight', 'Lower your chest between your hands, then press up'] },
  { id: 'diamond-push-up', name: 'Diamond push-up', progression: 'push', mode: 'reps', startTarget: 4, cues: ['Hands together under your chest, thumbs and index fingers forming a diamond', 'Elbows stay close to your sides', 'Lower your chest to your hands, then press up'] },

  // Squat
  { id: 'chair-squat', name: 'Chair squat', progression: 'squat', mode: 'reps', startTarget: 10, cues: ['Stand in front of a chair, feet shoulder-width apart', 'Sit back until you lightly touch the seat', 'Stand up by driving through your heels'] },
  { id: 'squat', name: 'Bodyweight squat', progression: 'squat', mode: 'reps', startTarget: 10, cues: ['Feet shoulder-width apart, toes slightly out', 'Hips back and down until your thighs are parallel to the floor', 'Chest up, knees tracking over your toes'] },
  { id: 'pause-squat', name: 'Pause squat', progression: 'squat', mode: 'reps', startTarget: 8, cues: ['Squat down to parallel', 'Hold the bottom position for 2 seconds', 'Drive up through your heels'] },
  { id: 'split-squat', name: 'Split squat', progression: 'squat', mode: 'reps', startTarget: 6, cues: ['Long stride stance, back heel raised', 'Lower your back knee toward the floor', 'Do all reps on one leg, then switch'] },
  { id: 'jump-squat', name: 'Jump squat', progression: 'squat', mode: 'reps', startTarget: 8, cues: ['Squat down to parallel', 'Jump up explosively', 'Land softly and go straight into the next rep'] },

  // Hinge
  { id: 'glute-bridge', name: 'Glute bridge', progression: 'hinge', mode: 'reps', startTarget: 10, cues: ['Lie on your back, knees bent, feet flat', 'Push through your heels to lift your hips until knees, hips and shoulders line up', 'Squeeze your glutes at the top, lower slowly'] },
  { id: 'single-leg-glute-bridge', name: 'Single-leg glute bridge', progression: 'hinge', mode: 'reps', startTarget: 6, cues: ['Glute bridge with one leg extended', 'Keep your hips level', 'Do all reps on one side, then switch'] },
  { id: 'single-leg-bridge-hold', name: 'Single-leg bridge hold', progression: 'hinge', mode: 'hold', startTarget: 20, cues: ['Lift into a single-leg glute bridge', 'Hold your hips high and level', 'Switch legs halfway through'] },

  // Lunge
  { id: 'reverse-lunge', name: 'Reverse lunge', progression: 'lunge', mode: 'reps', startTarget: 6, cues: ['Step one foot back and lower your back knee toward the floor', 'Front knee stays above the ankle', 'Push through your front heel to return; alternate legs'] },
  { id: 'forward-lunge', name: 'Forward lunge', progression: 'lunge', mode: 'reps', startTarget: 6, cues: ['Step forward and lower until both knees are at about 90°', 'Torso upright', 'Push back to standing; alternate legs'] },
  { id: 'alternating-lunge', name: 'Alternating lunge', progression: 'lunge', mode: 'reps', startTarget: 10, cues: ['Lunge, return, and lunge with the other leg without pausing', 'Torso upright', 'Control the way down'] },

  // Core (hold)
  { id: 'knee-plank', name: 'Knee plank', progression: 'coreHold', mode: 'hold', startTarget: 20, cues: ['Forearms and knees on the floor', 'Straight line from knees to head', "Breathe steadily, don't hold your breath"] },
  { id: 'plank', name: 'Plank', progression: 'coreHold', mode: 'hold', startTarget: 20, cues: ['Forearms on the floor, elbows under your shoulders, on your toes', 'Squeeze glutes and abs, hips level', 'Breathe steadily'] },
  { id: 'plank-shoulder-taps', name: 'Plank shoulder taps', progression: 'coreHold', mode: 'reps', startTarget: 10, cues: ['High plank on your hands, feet wide', 'Tap the opposite shoulder with one hand', 'Keep your hips as still as possible; alternate'] },

  // Core (dynamic)
  { id: 'dead-bug', name: 'Dead bug', progression: 'coreDynamic', mode: 'reps', startTarget: 8, cues: ['Lie on your back, arms up, knees bent at 90° above your hips', 'Lower the opposite arm and leg toward the floor', 'Lower back stays pressed into the floor; alternate'] },
  { id: 'bicycle-crunch', name: 'Bicycle crunch', progression: 'coreDynamic', mode: 'reps', startTarget: 10, cues: ['Hands lightly behind your head, shoulders off the floor', 'Bring one elbow toward the opposite knee while extending the other leg', 'Move slowly; alternate sides'] },
  { id: 'hollow-hold', name: 'Hollow hold', progression: 'coreDynamic', mode: 'hold', startTarget: 15, cues: ['Lie on your back, arms overhead', 'Lift shoulders and legs a few centimetres off the floor', 'Lower back pressed into the floor'] },

  // Back
  { id: 'prone-ytw', name: 'Prone Y-T-W raise', progression: 'back', mode: 'reps', startTarget: 6, cues: ['Lie face down, forehead on a towel', 'Lift your arms into a Y, then a T, then a W: that is one rep', 'Squeeze your shoulder blades together, thumbs up'] },
  { id: 'superman-hold', name: 'Superman hold', progression: 'back', mode: 'hold', startTarget: 15, cues: ['Lie face down, arms extended overhead', 'Lift arms, chest and legs off the floor', 'Hold while looking at the floor'] },
  { id: 'reverse-snow-angel', name: 'Reverse snow angel', progression: 'back', mode: 'reps', startTarget: 8, cues: ['Lie face down, arms by your sides, lifted off the floor', 'Sweep your arms overhead in an arc without touching the floor', 'Sweep back down slowly'] },
];

export const EXERCISES: Record<string, Exercise> = Object.fromEntries(EXERCISE_LIST.map((exercise) => [exercise.id, exercise]));
```

- [ ] **Step 7: Implement `src/domain/catalog/progressions.ts`**

```ts
import { PROGRESSION_IDS, type Levels, type ProgressionId } from '../primitives';
import { EXERCISES, EXERCISE_LIST, type Exercise } from './exercises';

export type Progression = { id: ProgressionId; name: string; steps: string[] };

const NAMES: Record<ProgressionId, string> = {
  push: 'Push',
  squat: 'Squat',
  hinge: 'Hinge',
  lunge: 'Lunge',
  coreHold: 'Core (hold)',
  coreDynamic: 'Core (dynamic)',
  back: 'Back',
};

export const PROGRESSIONS = Object.fromEntries(
  PROGRESSION_IDS.map((id) => [
    id,
    { id, name: NAMES[id], steps: EXERCISE_LIST.filter((exercise) => exercise.progression === id).map((exercise) => exercise.id) },
  ]),
) as Record<ProgressionId, Progression>;

export function exerciseFor(progression: ProgressionId, step: number): Exercise {
  const id = PROGRESSIONS[progression].steps[step];
  const exercise = id === undefined ? undefined : EXERCISES[id];
  if (!exercise) throw new Error(`No step ${step} in Progression ${progression}`);
  return exercise;
}

export function lastStep(progression: ProgressionId): number {
  return PROGRESSIONS[progression].steps.length - 1;
}

export function defaultLevels(): Levels {
  return Object.fromEntries(
    PROGRESSION_IDS.map((id) => [id, { step: 0, target: exerciseFor(id, 0).startTarget }]),
  ) as Levels;
}
```

- [ ] **Step 8: Implement `src/domain/catalog/routines.ts` and `src/domain/catalog/warmup.ts`**

`routines.ts`:

```ts
import type { ProgressionId, RotationRoutineId, RoutineId } from '../primitives';

export type Routine = {
  id: RoutineId;
  name: string;
  slots: ProgressionId[];
  rounds: number;
  warmup: boolean;
};

export const ROUTINES: Record<RoutineId, Routine> = {
  A: { id: 'A', name: 'Push & core', slots: ['push', 'squat', 'coreHold', 'back'], rounds: 3, warmup: true },
  B: { id: 'B', name: 'Legs & back', slots: ['lunge', 'hinge', 'push', 'coreDynamic'], rounds: 3, warmup: true },
  C: { id: 'C', name: 'Full body', slots: ['squat', 'push', 'back', 'coreHold'], rounds: 3, warmup: true },
  short: { id: 'short', name: 'Short Routine', slots: ['squat', 'push', 'coreHold'], rounds: 1, warmup: false },
};

export const ROTATION: RotationRoutineId[] = ['A', 'B', 'C'];

export const SHORT_ROUTINE_ID: RoutineId = 'short';
```

`warmup.ts`:

```ts
export type WarmupMove = { name: string; seconds: number; cues: string[] };

export const WARMUP: WarmupMove[] = [
  { name: 'Arm circles', seconds: 20, cues: ['Arms out to the sides', 'Small circles growing bigger, switch direction halfway'] },
  { name: 'Hip circles', seconds: 20, cues: ['Hands on your hips, feet hip-width apart', 'Slow big circles, switch direction halfway'] },
  { name: 'Torso twists', seconds: 20, cues: ['Feet planted, arms relaxed', 'Rotate your upper body side to side'] },
  { name: 'Easy squats', seconds: 30, cues: ['Slow, shallow squats', 'Wake the legs up, no effort yet'] },
];
```

- [ ] **Step 9: Implement `src/domain/testing/builders.ts`**

```ts
import { defaultLevels } from '../catalog/progressions';
import type { LocalDate } from '../dates';
import type { EventOf } from '../events';
import type { Levels, ProgressionId, ProgressionLevel, Rating, RotationRoutineId, RoutineId } from '../primitives';
import { DEFAULT_SETTINGS, type FreezePolicy } from '../settings';

/** Test-only helpers. Every event is recorded at 07:00 UTC on `recordedOn` (defaults to its `date`). */
const at = (date: LocalDate) => `${date}T07:00:00.000Z`;

export const session = (date: LocalDate, routineId: RoutineId = 'A', skipped: ProgressionId[] = []): EventOf<'sessionFinished'> => ({
  type: 'sessionFinished', at: at(date), date, routineId, skipped,
});

export const rating = (date: LocalDate, progression: ProgressionId, value: Rating, exerciseId = 'any'): EventOf<'ratingGiven'> => ({
  type: 'ratingGiven', at: at(date), date, progression, exerciseId, rating: value,
});

export const weighIn = (date: LocalDate, kg: number, recordedOn: LocalDate = date): EventOf<'weighInRecorded'> => ({
  type: 'weighInRecorded', at: at(recordedOn), date, kg,
});

export const weighInDeleted = (date: LocalDate): EventOf<'weighInDeleted'> => ({
  type: 'weighInDeleted', at: at(date), date,
});

export const placement = (date: LocalDate, levels: Levels = defaultLevels(), rotationStart: RotationRoutineId = 'A'): EventOf<'placementCompleted'> => ({
  type: 'placementCompleted', at: at(date), date, levels, rotationStart,
});

export const accepted = (date: LocalDate, progression: ProgressionId, from: ProgressionLevel, to: ProgressionLevel): EventOf<'adjustmentAccepted'> => ({
  type: 'adjustmentAccepted', at: at(date), date, progression, from, to,
});

export const dismissed = (date: LocalDate, progression: ProgressionId): EventOf<'adjustmentDismissed'> => ({
  type: 'adjustmentDismissed', at: at(date), date, progression,
});

export const freezePolicy = (date: LocalDate, policy: Partial<FreezePolicy>): EventOf<'freezePolicySet'> => ({
  type: 'freezePolicySet', at: at(date), date, policy: { ...DEFAULT_SETTINGS.freeze, ...policy },
});
```

- [ ] **Step 10: Run tests and typecheck**

Run: `npm test && npm run typecheck`
Expected: all PASS, typecheck exits 0.

- [ ] **Step 11: Commit**

```bash
git add src/domain
git commit -m "feat(domain): add settings, events and the Exercise/Routine catalog"
```

---

### Task 3: Progression levels and Placement

**Files:**
- Create: `src/domain/progression.ts`, `src/domain/placement.ts`
- Test: `src/domain/progression.test.ts`, `src/domain/placement.test.ts`

**Interfaces:**
- Consumes: `defaultLevels`, `exerciseFor`, `lastStep` (catalog/progressions), `DomainEvent`, `Levels`, `DEFAULT_SETTINGS`, builders.
- Produces:
  - `deriveLevels(events: DomainEvent[]): Levels`
  - `type PushUpAnswer = '0'|'1-5'|'6-15'|'15+'`, `type SquatAnswer = 'under10'|'10-25'|'25+'`, `type PlankAnswer = 'under20'|'20-45'|'45+'`, `type PlacementAnswers = { pushUps: PushUpAnswer; squats: SquatAnswer; plank: PlankAnswer }`
  - `placementLevels(answers: PlacementAnswers): Levels`

- [ ] **Step 1: Write the failing tests**

`src/domain/progression.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { defaultLevels } from './catalog/progressions';
import { deriveLevels } from './progression';
import { accepted, placement, session } from './testing/builders';

describe('deriveLevels', () => {
  it('uses default levels before anything happened', () => {
    expect(deriveLevels([])).toEqual(defaultLevels());
  });

  it('takes levels from Placement', () => {
    const levels = { ...defaultLevels(), push: { step: 2, target: 8 } };
    expect(deriveLevels([placement('2026-10-05', levels)]).push).toEqual({ step: 2, target: 8 });
  });

  it('applies an accepted Adjustment to its Progression only', () => {
    const levels = deriveLevels([
      placement('2026-10-05'),
      session('2026-10-05'),
      accepted('2026-10-05', 'push', { step: 0, target: 10 }, { step: 0, target: 12 }),
    ]);
    expect(levels.push).toEqual({ step: 0, target: 12 });
    expect(levels.squat).toEqual(defaultLevels().squat);
  });

  it('lets a redone Placement overwrite earlier Adjustments', () => {
    const levels = deriveLevels([
      accepted('2026-10-05', 'push', { step: 0, target: 10 }, { step: 0, target: 12 }),
      placement('2026-10-06', { ...defaultLevels(), push: { step: 3, target: 6 } }),
    ]);
    expect(levels.push).toEqual({ step: 3, target: 6 });
  });
});
```

`src/domain/placement.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { exerciseFor, lastStep } from './catalog/progressions';
import { placementLevels, type PlankAnswer, type PushUpAnswer, type SquatAnswer } from './placement';
import { PROGRESSION_IDS } from './primitives';
import { DEFAULT_SETTINGS } from './settings';

const PUSH_UPS: PushUpAnswer[] = ['0', '1-5', '6-15', '15+'];
const SQUATS: SquatAnswer[] = ['under10', '10-25', '25+'];
const PLANKS: PlankAnswer[] = ['under20', '20-45', '45+'];

describe('placementLevels', () => {
  it('puts someone who can do about 5 push-ups on knee push-ups', () => {
    const levels = placementLevels({ pushUps: '1-5', squats: '10-25', plank: '20-45' });
    expect(exerciseFor('push', levels.push.step).id).toBe('knee-push-up');
    expect(levels.push.target).toBe(8);
  });

  it('places a strong plank on a 45-second plank', () => {
    const levels = placementLevels({ pushUps: '0', squats: 'under10', plank: '45+' });
    expect(exerciseFor('coreHold', levels.coreHold.step).id).toBe('plank');
    expect(levels.coreHold.target).toBe(45);
  });

  it('produces a valid level for every Progression for every combination of answers', () => {
    const { repCeiling, holdCeiling } = DEFAULT_SETTINGS.adjustments;
    for (const pushUps of PUSH_UPS) for (const squats of SQUATS) for (const plank of PLANKS) {
      const levels = placementLevels({ pushUps, squats, plank });
      for (const id of PROGRESSION_IDS) {
        const { step, target } = levels[id];
        expect(step).toBeLessThanOrEqual(lastStep(id));
        const ceiling = exerciseFor(id, step).mode === 'reps' ? repCeiling : holdCeiling;
        expect(target).toBeGreaterThanOrEqual(1);
        expect(target).toBeLessThanOrEqual(ceiling);
      }
    }
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — unresolved `./progression` and `./placement`.

- [ ] **Step 3: Implement `src/domain/progression.ts`**

```ts
import { defaultLevels } from './catalog/progressions';
import type { DomainEvent } from './events';
import type { Levels } from './primitives';

/** The user's current Progression Step and Target for every Progression. The latest Placement or accepted Adjustment wins. */
export function deriveLevels(events: DomainEvent[]): Levels {
  let levels = defaultLevels();
  for (const event of events) {
    if (event.type === 'placementCompleted') levels = { ...event.levels };
    if (event.type === 'adjustmentAccepted') levels = { ...levels, [event.progression]: event.to };
  }
  return levels;
}
```

- [ ] **Step 4: Implement `src/domain/placement.ts`**

```ts
import type { Levels } from './primitives';

export type PushUpAnswer = '0' | '1-5' | '6-15' | '15+';
export type SquatAnswer = 'under10' | '10-25' | '25+';
export type PlankAnswer = 'under20' | '20-45' | '45+';
export type PlacementAnswers = { pushUps: PushUpAnswer; squats: SquatAnswer; plank: PlankAnswer };

const PUSH: Record<PushUpAnswer, Pick<Levels, 'push'>> = {
  '0': { push: { step: 0, target: 10 } },
  '1-5': { push: { step: 2, target: 8 } },
  '6-15': { push: { step: 3, target: 6 } },
  '15+': { push: { step: 4, target: 6 } },
};

const LEGS: Record<SquatAnswer, Pick<Levels, 'squat' | 'lunge' | 'hinge'>> = {
  under10: { squat: { step: 0, target: 10 }, lunge: { step: 0, target: 6 }, hinge: { step: 0, target: 10 } },
  '10-25': { squat: { step: 1, target: 10 }, lunge: { step: 0, target: 8 }, hinge: { step: 0, target: 12 } },
  '25+': { squat: { step: 2, target: 8 }, lunge: { step: 1, target: 6 }, hinge: { step: 1, target: 6 } },
};

const CORE: Record<PlankAnswer, Pick<Levels, 'coreHold' | 'coreDynamic' | 'back'>> = {
  under20: { coreHold: { step: 0, target: 20 }, coreDynamic: { step: 0, target: 8 }, back: { step: 0, target: 6 } },
  '20-45': { coreHold: { step: 1, target: 20 }, coreDynamic: { step: 0, target: 10 }, back: { step: 0, target: 8 } },
  '45+': { coreHold: { step: 1, target: 45 }, coreDynamic: { step: 1, target: 10 }, back: { step: 1, target: 20 } },
};

export function placementLevels(answers: PlacementAnswers): Levels {
  return { ...PUSH[answers.pushUps], ...LEGS[answers.squats], ...CORE[answers.plank] };
}
```

- [ ] **Step 5: Run tests and typecheck**

Run: `npm test && npm run typecheck`
Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add src/domain
git commit -m "feat(domain): derive Progression levels and map Placement answers"
```

---

### Task 4: Adjustments from Ratings

**Files:**
- Create: `src/domain/adjustments.ts`
- Test: `src/domain/adjustments.test.ts`

**Interfaces:**
- Consumes: `deriveLevels`, `exerciseFor`, `lastStep`, `AdjustmentRules`, `DEFAULT_SETTINGS`, `ProgressionLevel`, builders.
- Produces:
  - `type Direction = 'up' | 'down'`
  - `type Adjustment = { progression: ProgressionId; direction: Direction; from: ProgressionLevel; to: ProgressionLevel }`
  - `nextLevel(progression: ProgressionId, level: ProgressionLevel, direction: Direction, rules: AdjustmentRules): ProgressionLevel | null`
  - `pendingAdjustments(events: DomainEvent[], rules: AdjustmentRules): Adjustment[]`

  The app turns an accepted `Adjustment` into an `adjustmentAccepted` event `{ progression, from, to }`, a dismissed one into `adjustmentDismissed { progression }`.

- [ ] **Step 1: Write the failing tests**

`src/domain/adjustments.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { nextLevel, pendingAdjustments } from './adjustments';
import { defaultLevels } from './catalog/progressions';
import { DEFAULT_SETTINGS } from './settings';
import { accepted, dismissed, placement, rating } from './testing/builders';

const rules = DEFAULT_SETTINGS.adjustments;
const D = '2026-10-05';
// Push at knee push-ups × 8
const start = placement(D, { ...defaultLevels(), push: { step: 2, target: 8 } });

describe('nextLevel', () => {
  it('adds reps when going up below the ceiling', () => {
    expect(nextLevel('push', { step: 2, target: 8 }, 'up', rules)).toEqual({ step: 2, target: 10 });
  });

  it('moves to the next step at its start Target once at the ceiling', () => {
    expect(nextLevel('push', { step: 2, target: 12 }, 'up', rules)).toEqual({ step: 3, target: 5 });
  });

  it('keeps adding reps on the last step', () => {
    expect(nextLevel('push', { step: 5, target: 12 }, 'up', rules)).toEqual({ step: 5, target: 14 });
  });

  it('adds seconds for a Hold', () => {
    expect(nextLevel('coreHold', { step: 1, target: 20 }, 'up', rules)).toEqual({ step: 1, target: 25 });
    expect(nextLevel('hinge', { step: 2, target: 20 }, 'up', rules)).toEqual({ step: 2, target: 25 });
  });

  it('removes reps when going down above the floor', () => {
    expect(nextLevel('push', { step: 2, target: 8 }, 'down', rules)).toEqual({ step: 2, target: 6 });
  });

  it('drops to the previous step just under its ceiling at the floor', () => {
    expect(nextLevel('push', { step: 2, target: 4 }, 'down', rules)).toEqual({ step: 1, target: 10 });
  });

  it('clamps to the floor on the first step, then has nowhere to go', () => {
    expect(nextLevel('push', { step: 0, target: 5 }, 'down', rules)).toEqual({ step: 0, target: 4 });
    expect(nextLevel('push', { step: 0, target: 4 }, 'down', rules)).toBeNull();
  });
});

describe('pendingAdjustments', () => {
  it('suggests going up after 2 "too easy" Ratings in a row', () => {
    const events = [start, rating(D, 'push', 'tooEasy'), rating('2026-10-06', 'push', 'tooEasy')];
    expect(pendingAdjustments(events, rules)).toEqual([
      { progression: 'push', direction: 'up', from: { step: 2, target: 8 }, to: { step: 2, target: 10 } },
    ]);
  });

  it('suggests going down after 2 "too hard" Ratings in a row', () => {
    const events = [start, rating(D, 'push', 'tooHard'), rating('2026-10-06', 'push', 'tooHard')];
    expect(pendingAdjustments(events, rules)[0]).toMatchObject({ direction: 'down', to: { step: 2, target: 6 } });
  });

  it('needs the Ratings to be consecutive', () => {
    expect(pendingAdjustments([start, rating(D, 'push', 'tooEasy')], rules)).toEqual([]);
    expect(pendingAdjustments([start, rating(D, 'push', 'tooEasy'), rating(D, 'push', 'ok')], rules)).toEqual([]);
    const events = [start, rating(D, 'push', 'ok'), rating(D, 'push', 'tooEasy'), rating(D, 'push', 'tooEasy')];
    expect(pendingAdjustments(events, rules)).toHaveLength(1);
  });

  it('does not mix Ratings of different Progressions', () => {
    const events = [start, rating(D, 'push', 'tooEasy'), rating(D, 'squat', 'tooEasy')];
    expect(pendingAdjustments(events, rules)).toEqual([]);
  });

  it('starts counting again after an accepted Adjustment', () => {
    const events = [
      start,
      rating(D, 'push', 'tooEasy'),
      rating(D, 'push', 'tooEasy'),
      accepted(D, 'push', { step: 2, target: 8 }, { step: 2, target: 10 }),
      rating('2026-10-06', 'push', 'tooEasy'),
    ];
    expect(pendingAdjustments(events, rules)).toEqual([]);
  });

  it('starts counting again after a dismissed Adjustment', () => {
    const events = [start, rating(D, 'push', 'tooEasy'), rating(D, 'push', 'tooEasy'), dismissed(D, 'push')];
    expect(pendingAdjustments(events, rules)).toEqual([]);
  });

  it('starts counting again after a redone Placement', () => {
    const events = [start, rating(D, 'push', 'tooEasy'), placement('2026-10-06'), rating('2026-10-06', 'push', 'tooEasy')];
    expect(pendingAdjustments(events, rules)).toEqual([]);
  });

  it('honours the "ratings in a row" setting and the on/off switch', () => {
    const events = [start, rating(D, 'push', 'tooEasy'), rating(D, 'push', 'tooEasy')];
    expect(pendingAdjustments(events, { ...rules, ratingsInARow: 3 })).toEqual([]);
    expect(pendingAdjustments(events, { ...rules, enabled: false })).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- adjustments`
Expected: FAIL — unresolved `./adjustments`.

- [ ] **Step 3: Implement `src/domain/adjustments.ts`**

```ts
import type { ExerciseMode } from './catalog/exercises';
import { exerciseFor, lastStep } from './catalog/progressions';
import type { DomainEvent } from './events';
import type { ProgressionId, ProgressionLevel, Rating } from './primitives';
import { deriveLevels } from './progression';
import type { AdjustmentRules } from './settings';

export type Direction = 'up' | 'down';

export type Adjustment = {
  progression: ProgressionId;
  direction: Direction;
  from: ProgressionLevel;
  to: ProgressionLevel;
};

function limits(mode: ExerciseMode, rules: AdjustmentRules) {
  return mode === 'reps'
    ? { increment: rules.repIncrement, ceiling: rules.repCeiling, floor: rules.repFloor }
    : { increment: rules.holdIncrement, ceiling: rules.holdCeiling, floor: rules.holdFloor };
}

export function nextLevel(
  progression: ProgressionId,
  level: ProgressionLevel,
  direction: Direction,
  rules: AdjustmentRules,
): ProgressionLevel | null {
  const { increment, ceiling, floor } = limits(exerciseFor(progression, level.step).mode, rules);

  if (direction === 'up') {
    if (level.target >= ceiling && level.step < lastStep(progression)) {
      return { step: level.step + 1, target: exerciseFor(progression, level.step + 1).startTarget };
    }
    return { step: level.step, target: level.target + increment };
  }

  if (level.target - increment >= floor) return { step: level.step, target: level.target - increment };
  if (level.step > 0) {
    const previous = limits(exerciseFor(progression, level.step - 1).mode, rules);
    return { step: level.step - 1, target: previous.ceiling - previous.increment };
  }
  if (level.target > floor) return { step: level.step, target: floor };
  return null;
}

/** Adjustments to propose now, from the Ratings since each Progression's last Placement or Adjustment decision. */
export function pendingAdjustments(events: DomainEvent[], rules: AdjustmentRules): Adjustment[] {
  if (!rules.enabled) return [];

  const recent = new Map<ProgressionId, Rating[]>();
  for (const event of events) {
    if (event.type === 'placementCompleted') recent.clear();
    if (event.type === 'adjustmentAccepted' || event.type === 'adjustmentDismissed') recent.delete(event.progression);
    if (event.type === 'ratingGiven') recent.set(event.progression, [...(recent.get(event.progression) ?? []), event.rating]);
  }

  const levels = deriveLevels(events);
  const adjustments: Adjustment[] = [];
  for (const [progression, ratings] of recent) {
    const lastRatings = ratings.slice(-rules.ratingsInARow);
    if (lastRatings.length < rules.ratingsInARow) continue;

    const direction: Direction | null = lastRatings.every((r) => r === 'tooEasy')
      ? 'up'
      : lastRatings.every((r) => r === 'tooHard')
        ? 'down'
        : null;
    if (!direction) continue;

    const from = levels[progression];
    const to = nextLevel(progression, from, direction, rules);
    if (to) adjustments.push({ progression, direction, from, to });
  }
  return adjustments;
}
```

- [ ] **Step 4: Run tests and typecheck**

Run: `npm test && npm run typecheck`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain
git commit -m "feat(domain): suggest Adjustments from consecutive Ratings"
```

---

### Task 5: Rotation and Session plans

**Files:**
- Create: `src/domain/rotation.ts`, `src/domain/sessionPlan.ts`
- Test: `src/domain/rotation.test.ts`, `src/domain/sessionPlan.test.ts`

**Interfaces:**
- Consumes: `ROUTINES`, `ROTATION`, `SHORT_ROUTINE_ID`, `WARMUP`, `exerciseFor`, `placementLevels`, `DEFAULT_SETTINGS`, `SessionSettings`, builders.
- Produces:
  - `nextRoutineId(events: DomainEvent[]): RotationRoutineId`
  - `type PlanStep = { kind: 'warmup'; name: string; seconds: number; cues: string[] } | { kind: 'exercise'; round: number; progression: ProgressionId; exerciseId: string; mode: ExerciseMode; target: number } | { kind: 'rest'; seconds: number }`
  - `SECONDS_PER_REP = 3`
  - `buildSessionPlan(routineId: RoutineId, levels: Levels, settings: SessionSettings): PlanStep[]`
  - `estimateSeconds(plan: PlanStep[]): number`

- [ ] **Step 1: Write the failing tests**

`src/domain/rotation.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { nextRoutineId } from './rotation';
import { placement, session } from './testing/builders';

describe('nextRoutineId', () => {
  it('starts with Routine A', () => {
    expect(nextRoutineId([])).toBe('A');
  });

  it('advances A → B → C → A as full Routines are finished', () => {
    expect(nextRoutineId([session('2026-10-05', 'A')])).toBe('B');
    expect(nextRoutineId([session('2026-10-05', 'A'), session('2026-10-06', 'B'), session('2026-10-07', 'C')])).toBe('A');
  });

  it('does not advance on missed days', () => {
    // A on Monday, nothing Tuesday → B on Wednesday
    expect(nextRoutineId([session('2026-10-05', 'A')])).toBe('B');
  });

  it('does not advance for the Short Routine, even on the same day as a full one', () => {
    expect(nextRoutineId([session('2026-10-05', 'short')])).toBe('A');
    expect(nextRoutineId([session('2026-10-05', 'short'), session('2026-10-05', 'A')])).toBe('B');
  });

  it('restarts from the Rotation start chosen in Placement', () => {
    expect(nextRoutineId([session('2026-10-05', 'A'), placement('2026-10-06', undefined, 'C')])).toBe('C');
    expect(nextRoutineId([placement('2026-10-06', undefined, 'C'), session('2026-10-06', 'C')])).toBe('A');
  });
});
```

`src/domain/sessionPlan.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { ROTATION } from './catalog/routines';
import { placementLevels } from './placement';
import { buildSessionPlan, estimateSeconds } from './sessionPlan';
import { DEFAULT_SETTINGS } from './settings';

const settings = DEFAULT_SETTINGS.session;
const levels = placementLevels({ pushUps: '1-5', squats: '10-25', plank: '20-45' });

describe('buildSessionPlan', () => {
  it('lays out Warm-up, then 3 Rounds of 4 Exercises with rests in between', () => {
    const plan = buildSessionPlan('A', levels, settings);
    expect(plan.filter((s) => s.kind === 'warmup')).toHaveLength(4);
    expect(plan.filter((s) => s.kind === 'exercise')).toHaveLength(12);
    expect(plan.filter((s) => s.kind === 'rest')).toHaveLength(3 * 3 + 2);
    expect(plan[0].kind).toBe('warmup');
    expect(plan[plan.length - 1].kind).toBe('exercise');
  });

  it('fills each Slot from the current Progression Step and Target', () => {
    const plan = buildSessionPlan('A', levels, settings);
    expect(plan.find((s) => s.kind === 'exercise')).toEqual({
      kind: 'exercise', round: 1, progression: 'push', exerciseId: 'knee-push-up', mode: 'reps', target: 8,
    });
    expect(plan.find((s) => s.kind === 'exercise' && s.progression === 'coreHold')).toMatchObject({ mode: 'hold', target: 20 });
  });

  it('uses the rest settings', () => {
    const plan = buildSessionPlan('A', levels, { ...settings, restSeconds: 15, roundRestSeconds: 90 });
    const rests = plan.flatMap((s) => (s.kind === 'rest' ? [s.seconds] : []));
    expect(rests.filter((s) => s === 15)).toHaveLength(9);
    expect(rests.filter((s) => s === 90)).toHaveLength(2);
  });

  it('leaves out the Warm-up when it is switched off', () => {
    expect(buildSessionPlan('A', levels, { ...settings, warmupEnabled: false }).some((s) => s.kind === 'warmup')).toBe(false);
  });

  it('makes the Short Routine a single Round without Warm-up', () => {
    const plan = buildSessionPlan('short', levels, settings);
    expect(plan.some((s) => s.kind === 'warmup')).toBe(false);
    expect(plan.filter((s) => s.kind === 'exercise')).toHaveLength(3);
  });
});

describe('estimateSeconds', () => {
  it('keeps every full Routine between 10 and 14 minutes for a beginner', () => {
    for (const id of ROTATION) {
      const minutes = estimateSeconds(buildSessionPlan(id, levels, settings)) / 60;
      expect(minutes).toBeGreaterThanOrEqual(10);
      expect(minutes).toBeLessThanOrEqual(14);
    }
  });

  it('keeps the Short Routine under 4 minutes', () => {
    expect(estimateSeconds(buildSessionPlan('short', levels, settings))).toBeLessThanOrEqual(240);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- rotation sessionPlan`
Expected: FAIL — unresolved `./rotation`, `./sessionPlan`.

- [ ] **Step 3: Implement `src/domain/rotation.ts`**

```ts
import { ROTATION, SHORT_ROUTINE_ID } from './catalog/routines';
import type { DomainEvent } from './events';
import type { RotationRoutineId } from './primitives';

/** The Routine to offer next: the Rotation advances only when a full Routine is finished. */
export function nextRoutineId(events: DomainEvent[]): RotationRoutineId {
  let start: RotationRoutineId = ROTATION[0];
  let finished = 0;
  for (const event of events) {
    if (event.type === 'placementCompleted') {
      start = event.rotationStart;
      finished = 0;
    }
    if (event.type === 'sessionFinished' && event.routineId !== SHORT_ROUTINE_ID) finished += 1;
  }
  return ROTATION[(ROTATION.indexOf(start) + finished) % ROTATION.length];
}
```

- [ ] **Step 4: Implement `src/domain/sessionPlan.ts`**

```ts
import type { ExerciseMode } from './catalog/exercises';
import { exerciseFor } from './catalog/progressions';
import { ROUTINES } from './catalog/routines';
import { WARMUP } from './catalog/warmup';
import type { Levels, ProgressionId, RoutineId } from './primitives';
import type { SessionSettings } from './settings';

export type PlanStep =
  | { kind: 'warmup'; name: string; seconds: number; cues: string[] }
  | { kind: 'exercise'; round: number; progression: ProgressionId; exerciseId: string; mode: ExerciseMode; target: number }
  | { kind: 'rest'; seconds: number };

/** Rough time per rep, used only to estimate Session length. */
export const SECONDS_PER_REP = 3;

export function buildSessionPlan(routineId: RoutineId, levels: Levels, settings: SessionSettings): PlanStep[] {
  const routine = ROUTINES[routineId];
  const plan: PlanStep[] = [];

  if (routine.warmup && settings.warmupEnabled) {
    for (const move of WARMUP) plan.push({ kind: 'warmup', ...move });
  }

  for (let round = 1; round <= routine.rounds; round++) {
    if (round > 1) plan.push({ kind: 'rest', seconds: settings.roundRestSeconds });
    routine.slots.forEach((progression, index) => {
      if (index > 0) plan.push({ kind: 'rest', seconds: settings.restSeconds });
      const level = levels[progression];
      const exercise = exerciseFor(progression, level.step);
      plan.push({ kind: 'exercise', round, progression, exerciseId: exercise.id, mode: exercise.mode, target: level.target });
    });
  }
  return plan;
}

export function estimateSeconds(plan: PlanStep[]): number {
  return plan.reduce((total, step) => {
    if (step.kind === 'exercise') return total + (step.mode === 'reps' ? step.target * SECONDS_PER_REP : step.target);
    return total + step.seconds;
  }, 0);
}
```

- [ ] **Step 5: Run tests and typecheck**

Run: `npm test && npm run typecheck`
Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add src/domain
git commit -m "feat(domain): add Rotation and Session plan building"
```

---

### Task 6: Streak and Freezes

**Files:**
- Create: `src/domain/streak.ts`
- Test: `src/domain/streak.test.ts`

**Interfaces:**
- Consumes: `addDays`, `eachDay`, `isMonday`, `mondayOf`, `DomainEvent`, `EventOf`, `DEFAULT_SETTINGS`, `FreezePolicy`, builders.
- Produces:
  - `type DayStatus = 'completed' | 'frozen' | 'missed' | 'pending'`
  - `type DayRecord = { date: LocalDate; status: DayStatus; streak: number }` (`streak` = Streak value at the end of that day)
  - `type StreakSummary = { current: number; best: number; freezesAvailable: number; days: DayRecord[]; resets: LocalDate[] }` (`resets` = days the Streak dropped to 0)
  - `computeStreak(events: DomainEvent[], today: LocalDate): StreakSummary`

Rules (from the spec): history starts at the first Session or Placement. Freezes are granted on that first day and every Monday (`min(maxBanked, banked + perWeek)`, or 0 when disabled). A missed past day uses a Freeze only while a Streak is alive. Today without a Session is `pending`, never missed. The Freeze policy for a day is the latest `freezePolicySet` dated on or before that week's Monday — or before the first day, for the first week.

- [ ] **Step 1: Write the failing tests**

`src/domain/streak.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { eachDay } from './dates';
import { computeStreak } from './streak';
import { freezePolicy, placement, session, weighIn } from './testing/builders';

const statusOn = (summary: ReturnType<typeof computeStreak>, date: string) => summary.days.find((d) => d.date === date)?.status;

describe('computeStreak', () => {
  it('is empty before the first Session, with this week\'s Freeze ready', () => {
    expect(computeStreak([], '2026-10-10')).toEqual({ current: 0, best: 0, freezesAvailable: 1, days: [], resets: [] });
  });

  it('counts consecutive Completed Days', () => {
    const events = eachDay('2026-10-05', '2026-10-07').map((d) => session(d));
    expect(computeStreak(events, '2026-10-07')).toMatchObject({ current: 3, best: 3 });
  });

  it('keeps the Streak while today is still pending', () => {
    const summary = computeStreak([session('2026-10-05'), session('2026-10-06')], '2026-10-07');
    expect(summary.current).toBe(2);
    expect(statusOn(summary, '2026-10-07')).toBe('pending');
  });

  it('counts a day with two Sessions once', () => {
    const events = [session('2026-10-05', 'short'), session('2026-10-05', 'A')];
    expect(computeStreak(events, '2026-10-05').current).toBe(1);
  });

  it('uses a Freeze for a missed day; the frozen day keeps but does not grow the Streak', () => {
    const events = [session('2026-10-05'), session('2026-10-06'), session('2026-10-08')];
    const summary = computeStreak(events, '2026-10-08');
    expect(statusOn(summary, '2026-10-07')).toBe('frozen');
    expect(summary.current).toBe(3);
    expect(summary.freezesAvailable).toBe(0);
  });

  it('resets when a day is missed with no Freeze left', () => {
    const events = [session('2026-10-05'), session('2026-10-06'), session('2026-10-09')];
    const summary = computeStreak(events, '2026-10-09');
    expect(statusOn(summary, '2026-10-07')).toBe('frozen');
    expect(statusOn(summary, '2026-10-08')).toBe('missed');
    expect(summary).toMatchObject({ current: 1, best: 2, resets: ['2026-10-08'] });
  });

  it('does not burn Freezes while there is no Streak to protect', () => {
    // Mon 28 Sep: Session. 29: frozen. 30: reset. Then nothing. Mon 5 Oct grants a Freeze that must stay unused.
    const summary = computeStreak([session('2026-09-28')], '2026-10-06');
    expect(statusOn(summary, '2026-09-29')).toBe('frozen');
    expect(statusOn(summary, '2026-10-05')).toBe('missed');
    expect(summary.freezesAvailable).toBe(1);
    expect(summary.current).toBe(0);
  });

  it('banks Freezes up to the maximum', () => {
    const events = eachDay('2026-09-14', '2026-10-05').map((d) => session(d));
    expect(computeStreak(events, '2026-10-05').freezesAvailable).toBe(2);
  });

  it('applies a mid-week Freeze settings change from the next Monday', () => {
    const events = [
      session('2026-10-05'),
      session('2026-10-06'),
      freezePolicy('2026-10-07', { perWeek: 0 }),
      session('2026-10-07'),
      // 8 Oct missed: still covered by this week's original policy
      session('2026-10-09'),
      session('2026-10-10'),
      session('2026-10-11'),
      session('2026-10-12'),
    ];
    const summary = computeStreak(events, '2026-10-12');
    expect(statusOn(summary, '2026-10-08')).toBe('frozen');
    expect(summary.current).toBe(7);
    expect(summary.freezesAvailable).toBe(0); // Monday 12 Oct granted 0 under the new policy
  });

  it('applies Freeze settings chosen on the very first day immediately', () => {
    const events = [
      placement('2026-10-07'),
      freezePolicy('2026-10-07', { enabled: false }),
      session('2026-10-07'),
      session('2026-10-09'),
    ];
    const summary = computeStreak(events, '2026-10-09');
    expect(statusOn(summary, '2026-10-08')).toBe('missed');
    expect(summary.current).toBe(1);
    expect(summary.freezesAvailable).toBe(0);
  });

  it('ignores backfilled Weigh-ins when deciding where history starts', () => {
    const summary = computeStreak([weighIn('2026-09-01', 80, '2026-10-09'), session('2026-10-09')], '2026-10-09');
    expect(summary.days).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- streak`
Expected: FAIL — unresolved `./streak`.

- [ ] **Step 3: Implement `src/domain/streak.ts`**

```ts
import { addDays, isMonday, mondayOf, type LocalDate } from './dates';
import type { DomainEvent, EventOf } from './events';
import { DEFAULT_SETTINGS, type FreezePolicy } from './settings';

export type DayStatus = 'completed' | 'frozen' | 'missed' | 'pending';
export type DayRecord = { date: LocalDate; status: DayStatus; streak: number };
export type StreakSummary = {
  current: number;
  best: number;
  freezesAvailable: number;
  days: DayRecord[];
  resets: LocalDate[];
};

function grant(policy: FreezePolicy, banked: number): number {
  return policy.enabled ? Math.min(policy.maxBanked, banked + policy.perWeek) : 0;
}

/** Freeze settings are snapshotted per week: changes apply from the next Monday (or immediately on the first day). */
function policyFor(policies: EventOf<'freezePolicySet'>[], date: LocalDate, firstDay: LocalDate): FreezePolicy {
  const monday = mondayOf(date);
  const cutoff = monday < firstDay ? firstDay : monday;
  let policy = DEFAULT_SETTINGS.freeze;
  for (const event of policies) if (event.date <= cutoff) policy = event.policy;
  return policy;
}

export function computeStreak(events: DomainEvent[], today: LocalDate): StreakSummary {
  const completedDays = new Set<LocalDate>();
  const policies: EventOf<'freezePolicySet'>[] = [];
  let firstDay: LocalDate | undefined;

  for (const event of events) {
    if (event.type === 'sessionFinished') completedDays.add(event.date);
    if (event.type === 'freezePolicySet') policies.push(event);
    if ((event.type === 'sessionFinished' || event.type === 'placementCompleted') && (firstDay === undefined || event.date < firstDay)) {
      firstDay = event.date;
    }
  }

  if (firstDay === undefined || firstDay > today) {
    return { current: 0, best: 0, freezesAvailable: grant(policyFor(policies, today, today), 0), days: [], resets: [] };
  }

  let current = 0;
  let best = 0;
  let freezes = 0;
  const days: DayRecord[] = [];
  const resets: LocalDate[] = [];

  for (let date = firstDay; date <= today; date = addDays(date, 1)) {
    if (date === firstDay || isMonday(date)) freezes = grant(policyFor(policies, date, firstDay), freezes);

    if (completedDays.has(date)) {
      current += 1;
      best = Math.max(best, current);
      days.push({ date, status: 'completed', streak: current });
    } else if (date === today) {
      days.push({ date, status: 'pending', streak: current });
    } else if (current > 0 && freezes > 0) {
      freezes -= 1;
      days.push({ date, status: 'frozen', streak: current });
    } else {
      if (current > 0) resets.push(date);
      current = 0;
      days.push({ date, status: 'missed', streak: 0 });
    }
  }

  return { current, best, freezesAvailable: freezes, days, resets };
}
```

- [ ] **Step 4: Run tests and typecheck**

Run: `npm test && npm run typecheck`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain
git commit -m "feat(domain): compute Streak with weekly Freezes from the event log"
```

---

### Task 7: Weigh-ins

**Files:**
- Create: `src/domain/weighins.ts`
- Test: `src/domain/weighins.test.ts`

**Interfaces:**
- Consumes: `addDays`, `DomainEvent`, builders.
- Produces:
  - `type WeighIn = { date: LocalDate; kg: number }`
  - `MIN_KG = 20`, `MAX_KG = 400`
  - `deriveWeighIns(events: DomainEvent[]): WeighIn[]` (sorted by date ascending)
  - `movingAverage7(weighIns: WeighIn[]): WeighIn[]` (one point per Weigh-in, averaged over the 7 days ending on it, rounded to 0.1)
  - `roundKg(kg: number): number`
  - `validateWeighIn(date: LocalDate, kg: number, today: LocalDate): string | null` (error message, or null if valid)

- [ ] **Step 1: Write the failing tests**

`src/domain/weighins.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { weighIn, weighInDeleted } from './testing/builders';
import { deriveWeighIns, movingAverage7, roundKg, validateWeighIn } from './weighins';

describe('deriveWeighIns', () => {
  it('keeps the latest entry for a day', () => {
    expect(deriveWeighIns([weighIn('2026-10-05', 82), weighIn('2026-10-05', 81.6)])).toEqual([{ date: '2026-10-05', kg: 81.6 }]);
  });

  it('removes a deleted day and allows re-entering it', () => {
    expect(deriveWeighIns([weighIn('2026-10-05', 82), weighInDeleted('2026-10-05')])).toEqual([]);
    expect(deriveWeighIns([weighIn('2026-10-05', 82), weighInDeleted('2026-10-05'), weighIn('2026-10-05', 81)])).toEqual([
      { date: '2026-10-05', kg: 81 },
    ]);
  });

  it('sorts backfilled entries by day', () => {
    const events = [weighIn('2026-10-07', 81), weighIn('2026-10-05', 82, '2026-10-07')];
    expect(deriveWeighIns(events).map((w) => w.date)).toEqual(['2026-10-05', '2026-10-07']);
  });
});

describe('movingAverage7', () => {
  it('averages the Weigh-ins of the 7 days ending on each point, across gaps', () => {
    const points = movingAverage7([
      { date: '2026-10-01', kg: 80 },
      { date: '2026-10-03', kg: 82 },
      { date: '2026-10-08', kg: 84 },
    ]);
    expect(points).toEqual([
      { date: '2026-10-01', kg: 80 },
      { date: '2026-10-03', kg: 81 },
      { date: '2026-10-08', kg: 83 }, // window 2–8 Oct: 82 and 84
    ]);
  });
});

describe('validateWeighIn', () => {
  const today = '2026-10-10';

  it('accepts today and past days', () => {
    expect(validateWeighIn(today, 81.4, today)).toBeNull();
    expect(validateWeighIn('2026-09-01', 81.4, today)).toBeNull();
  });

  it('rejects a future day', () => {
    expect(validateWeighIn('2026-10-11', 81.4, today)).toBe('A Weigh-in cannot be in the future.');
  });

  it('rejects impossible weights', () => {
    for (const kg of [19.9, 400.1, Number.NaN]) {
      expect(validateWeighIn(today, kg, today)).toBe('Weight must be between 20 and 400 kg.');
    }
  });
});

describe('roundKg', () => {
  it('rounds to one decimal', () => {
    expect(roundKg(80.456)).toBe(80.5);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- weighins`
Expected: FAIL — unresolved `./weighins`.

- [ ] **Step 3: Implement `src/domain/weighins.ts`**

```ts
import { addDays, type LocalDate } from './dates';
import type { DomainEvent } from './events';

export type WeighIn = { date: LocalDate; kg: number };

export const MIN_KG = 20;
export const MAX_KG = 400;

export function roundKg(kg: number): number {
  return Math.round(kg * 10) / 10;
}

/** One Weigh-in per day: the latest recorded entry wins, a deletion removes it. */
export function deriveWeighIns(events: DomainEvent[]): WeighIn[] {
  const byDate = new Map<LocalDate, number>();
  for (const event of events) {
    if (event.type === 'weighInRecorded') byDate.set(event.date, event.kg);
    if (event.type === 'weighInDeleted') byDate.delete(event.date);
  }
  return [...byDate]
    .map(([date, kg]) => ({ date, kg }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

export function movingAverage7(weighIns: WeighIn[]): WeighIn[] {
  return weighIns.map(({ date }) => {
    const from = addDays(date, -6);
    const window = weighIns.filter((w) => w.date >= from && w.date <= date);
    return { date, kg: roundKg(window.reduce((sum, w) => sum + w.kg, 0) / window.length) };
  });
}

export function validateWeighIn(date: LocalDate, kg: number, today: LocalDate): string | null {
  if (date > today) return 'A Weigh-in cannot be in the future.';
  if (!Number.isFinite(kg) || kg < MIN_KG || kg > MAX_KG) return `Weight must be between ${MIN_KG} and ${MAX_KG} kg.`;
  return null;
}
```

- [ ] **Step 4: Run tests and typecheck**

Run: `npm test && npm run typecheck`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain
git commit -m "feat(domain): derive Weigh-ins with 7-day average and validation"
```

---

### Task 8: Achievements

**Files:**
- Create: `src/domain/achievements.ts`
- Test: `src/domain/achievements.test.ts`

**Interfaces:**
- Consumes: `computeStreak`, `deriveWeighIns`, `addDays`, `PROGRESSIONS`, `EXERCISES`, `exerciseFor`, builders.
- Produces:
  - `type AchievementDef = { id: string; title: string; description: string }`
  - `type EarnedAchievement = { id: string; earnedOn: LocalDate }`
  - `ACHIEVEMENTS: AchievementDef[]` — ids `streak-{3,7,14,30,60,100}`, `sessions-{10,50,100,250}`, `weighins-{7,30}`, `comeback`, `unlock:<exerciseId>` for every Exercise beyond step 0
  - `earnedAchievements(events: DomainEvent[], today: LocalDate): EarnedAchievement[]` (sorted by `earnedOn`)
  - `newlyEarned(before: EarnedAchievement[], after: EarnedAchievement[]): EarnedAchievement[]`

- [ ] **Step 1: Write the failing tests**

`src/domain/achievements.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { ACHIEVEMENTS, earnedAchievements, newlyEarned } from './achievements';
import { eachDay } from './dates';
import { accepted, freezePolicy, placement, session, weighIn } from './testing/builders';

// Freezes off, so misses reset the Streak immediately and tests stay readable.
const noFreezes = (date: string) => freezePolicy(date, { enabled: false });
const ids = (earned: { id: string }[]) => earned.map((a) => a.id);
const earnedOn = (earned: { id: string; earnedOn: string }[], id: string) => earned.find((a) => a.id === id)?.earnedOn;

describe('earnedAchievements', () => {
  it('awards a Streak milestone on the day it is reached', () => {
    const events = [noFreezes('2026-10-01'), ...eachDay('2026-10-01', '2026-10-03').map((d) => session(d))];
    const earned = earnedAchievements(events, '2026-10-03');
    expect(earnedOn(earned, 'streak-3')).toBe('2026-10-03');
    expect(ids(earned)).not.toContain('streak-7');
  });

  it('awards a Streak milestone once, at its first occurrence', () => {
    const events = [
      noFreezes('2026-10-01'),
      ...eachDay('2026-10-01', '2026-10-03').map((d) => session(d)),
      ...eachDay('2026-10-05', '2026-10-07').map((d) => session(d)),
    ];
    const earned = earnedAchievements(events, '2026-10-07');
    expect(ids(earned).filter((id) => id === 'streak-3')).toHaveLength(1);
    expect(earnedOn(earned, 'streak-3')).toBe('2026-10-03');
  });

  it('counts every Session toward volume, including two on one day', () => {
    const events = eachDay('2026-10-01', '2026-10-05').flatMap((d) => [session(d, 'short'), session(d, 'A')]);
    expect(earnedOn(earnedAchievements(events, '2026-10-05'), 'sessions-10')).toBe('2026-10-05');
  });

  it('awards Weigh-ins in a row, including backfilled ones, and a gap breaks the run', () => {
    const run = eachDay('2026-10-01', '2026-10-07').map((d) => weighIn(d, 80, '2026-10-07'));
    expect(earnedOn(earnedAchievements(run, '2026-10-07'), 'weighins-7')).toBe('2026-10-07');

    const withGap = [...eachDay('2026-10-01', '2026-10-03'), ...eachDay('2026-10-05', '2026-10-08')].map((d) => weighIn(d, 80));
    expect(ids(earnedAchievements(withGap, '2026-10-08'))).not.toContain('weighins-7');
  });

  it('awards Comeback on the first Completed Day after a reset', () => {
    const events = [noFreezes('2026-10-01'), session('2026-10-01'), session('2026-10-02'), session('2026-10-05')];
    expect(earnedOn(earnedAchievements(events, '2026-10-05'), 'comeback')).toBe('2026-10-05');
    expect(ids(earnedAchievements([session('2026-10-01')], '2026-10-01'))).not.toContain('comeback');
  });

  it('awards an unlock when an accepted Adjustment reaches a new step', () => {
    const events = [placement('2026-10-01'), accepted('2026-10-04', 'push', { step: 2, target: 12 }, { step: 3, target: 5 })];
    expect(earnedOn(earnedAchievements(events, '2026-10-04'), 'unlock:push-up')).toBe('2026-10-04');
  });

  it('does not award unlocks for Placement, target changes or going down', () => {
    const events = [
      placement('2026-10-01', undefined),
      accepted('2026-10-02', 'push', { step: 0, target: 10 }, { step: 0, target: 12 }),
      accepted('2026-10-03', 'squat', { step: 1, target: 4 }, { step: 0, target: 10 }),
    ];
    expect(ids(earnedAchievements(events, '2026-10-03')).filter((id) => id.startsWith('unlock:'))).toEqual([]);
  });

  it('only ever returns known Achievements', () => {
    const known = new Set(ACHIEVEMENTS.map((a) => a.id));
    const events = [
      ...eachDay('2026-09-01', '2026-10-05').flatMap((d) => [session(d), weighIn(d, 80)]),
      accepted('2026-10-05', 'back', { step: 0, target: 12 }, { step: 1, target: 15 }),
    ];
    for (const id of ids(earnedAchievements(events, '2026-10-05'))) expect(known.has(id)).toBe(true);
  });
});

describe('newlyEarned', () => {
  it('returns Achievements present after but not before', () => {
    const before = [{ id: 'streak-3', earnedOn: '2026-10-03' }];
    const after = [...before, { id: 'sessions-10', earnedOn: '2026-10-05' }];
    expect(newlyEarned(before, after)).toEqual([{ id: 'sessions-10', earnedOn: '2026-10-05' }]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- achievements`
Expected: FAIL — unresolved `./achievements`.

- [ ] **Step 3: Implement `src/domain/achievements.ts`**

```ts
import { EXERCISES } from './catalog/exercises';
import { PROGRESSIONS, exerciseFor } from './catalog/progressions';
import { addDays, type LocalDate } from './dates';
import type { DomainEvent } from './events';
import { computeStreak } from './streak';
import { deriveWeighIns } from './weighins';

export type AchievementDef = { id: string; title: string; description: string };
export type EarnedAchievement = { id: string; earnedOn: LocalDate };

const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100];
const SESSION_MILESTONES = [10, 50, 100, 250];
const WEIGH_IN_MILESTONES = [7, 30];

export const ACHIEVEMENTS: AchievementDef[] = [
  ...STREAK_MILESTONES.map((n) => ({ id: `streak-${n}`, title: `${n}-day Streak`, description: `Complete ${n} days in a row.` })),
  ...SESSION_MILESTONES.map((n) => ({ id: `sessions-${n}`, title: `${n} Sessions`, description: `Finish ${n} Sessions in total.` })),
  ...WEIGH_IN_MILESTONES.map((n) => ({ id: `weighins-${n}`, title: `${n} Weigh-ins in a row`, description: `Log a Weigh-in ${n} days in a row.` })),
  { id: 'comeback', title: 'Comeback', description: 'Start a new Streak after losing one.' },
  ...Object.values(PROGRESSIONS).flatMap((progression) =>
    progression.steps.slice(1).map((exerciseId) => ({
      id: `unlock:${exerciseId}`,
      title: `Unlocked: ${EXERCISES[exerciseId].name}`,
      description: `Reach ${EXERCISES[exerciseId].name} in the ${progression.name} Progression.`,
    })),
  ),
];

/** Derived from the event log, so the list always reflects what actually happened (ADR 0001). */
export function earnedAchievements(events: DomainEvent[], today: LocalDate): EarnedAchievement[] {
  const earned = new Map<string, LocalDate>();
  const earn = (id: string, date: LocalDate) => {
    if (!earned.has(id)) earned.set(id, date);
  };

  const streak = computeStreak(events, today);
  for (const day of streak.days) {
    if (day.status !== 'completed') continue;
    for (const n of STREAK_MILESTONES) if (day.streak >= n) earn(`streak-${n}`, day.date);
  }

  const firstReset = streak.resets[0];
  if (firstReset !== undefined) {
    const comeback = streak.days.find((day) => day.date > firstReset && day.status === 'completed');
    if (comeback) earn('comeback', comeback.date);
  }

  let sessions = 0;
  for (const event of events) {
    if (event.type === 'sessionFinished') {
      sessions += 1;
      for (const n of SESSION_MILESTONES) if (sessions === n) earn(`sessions-${n}`, event.date);
    }
    if (event.type === 'adjustmentAccepted' && event.to.step > event.from.step) {
      earn(`unlock:${exerciseFor(event.progression, event.to.step).id}`, event.date);
    }
  }

  let run = 0;
  let previous: LocalDate | undefined;
  for (const weighIn of deriveWeighIns(events)) {
    run = previous !== undefined && addDays(previous, 1) === weighIn.date ? run + 1 : 1;
    previous = weighIn.date;
    for (const n of WEIGH_IN_MILESTONES) if (run >= n) earn(`weighins-${n}`, weighIn.date);
  }

  return [...earned]
    .map(([id, earnedOn]) => ({ id, earnedOn }))
    .sort((a, b) => (a.earnedOn < b.earnedOn ? -1 : a.earnedOn > b.earnedOn ? 1 : 0));
}

export function newlyEarned(before: EarnedAchievement[], after: EarnedAchievement[]): EarnedAchievement[] {
  const seen = new Set(before.map((a) => a.id));
  return after.filter((a) => !seen.has(a.id));
}
```

- [ ] **Step 4: Run tests and typecheck**

Run: `npm test && npm run typecheck`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain
git commit -m "feat(domain): derive Achievements including Comeback and unlocks"
```

---

### Task 9: Backup export/import and the public barrel

**Files:**
- Create: `src/domain/backup.ts`, `src/domain/index.ts`
- Test: `src/domain/backup.test.ts`

**Interfaces:**
- Consumes: `AppSettingsSchema`, `DEFAULT_SETTINGS`, `DomainEventSchema`, `LocalDate`, builders.
- Produces:
  - `BACKUP_APP = 'daily-calisthenics'`, `BACKUP_VERSION = 1`
  - `type Backup = { app: 'daily-calisthenics'; version: 1; exportedAt: string; settings: AppSettings; events: DomainEvent[] }`
  - `type ParseBackupResult = { ok: true; backup: Backup } | { ok: false; error: string }`
  - `serializeBackup(settings: AppSettings, events: DomainEvent[], exportedAt: Date): string`
  - `parseBackup(text: string): ParseBackupResult`
  - `backupFileName(today: LocalDate): string` → `daily-calisthenics-backup-YYYY-MM-DD.json`
  - `src/domain/index.ts` re-exporting every public module above (Plan 2 imports only from `src/domain`).

- [ ] **Step 1: Write the failing tests**

`src/domain/backup.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- backup`
Expected: FAIL — unresolved `./backup`.

- [ ] **Step 3: Implement `src/domain/backup.ts`**

```ts
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
```

- [ ] **Step 4: Create the public barrel `src/domain/index.ts`**

```ts
export * from './achievements';
export * from './adjustments';
export * from './backup';
export * from './catalog/exercises';
export * from './catalog/progressions';
export * from './catalog/routines';
export * from './catalog/warmup';
export * from './dates';
export * from './events';
export * from './placement';
export * from './primitives';
export * from './progression';
export * from './rotation';
export * from './sessionPlan';
export * from './settings';
export * from './streak';
export * from './weighins';
```

- [ ] **Step 5: Run the full suite and typecheck**

Run: `npm test && npm run typecheck`
Expected: every test file PASSES (dates, purity, catalog, events, progression, placement, adjustments, rotation, sessionPlan, streak, weighins, achievements, backup); typecheck exits 0.

- [ ] **Step 6: Commit**

```bash
git add src/domain
git commit -m "feat(domain): add backup export/import and public domain barrel"
```
