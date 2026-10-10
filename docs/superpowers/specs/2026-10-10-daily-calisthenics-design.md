# Daily Calisthenics — Design

Vocabulary: see [`CONTEXT.md`](../../../CONTEXT.md). Key decision: [ADR 0001](../../adr/0001-derive-streak-from-event-log.md).

## Product

A personal Android app that guides one person through a ~12-minute bodyweight Routine every morning, records a daily Weigh-in, and rewards consistency. Public GitHub repo (MIT), so others can install it too; every user's data stays on their own phone.

## Platform & distribution

- Expo (React Native, TypeScript), Android only.
- Display name **Daily Calisthenics**, package id `com.meuss.calisthenics`.
- Public repo on GitHub (user `Meuss`), MIT license.
- A GitHub Action builds a signed APK on each version tag and attaches it to a GitHub Release.
- v1: **dark theme only, English only, kg only.**

## Training

- **Exercise library (in code):** 7 Progressions, 3–6 steps each, floor + household furniture only:
  - Push: wall → incline → knee → full → wide → diamond push-up
  - Squat: chair squat → bodyweight squat → pause squat → split squat → jump squat
  - Hinge: glute bridge → single-leg glute bridge → single-leg bridge hold
  - Lunge: reverse → forward → alternating lunge
  - Core (hold): knee plank → plank → plank shoulder taps
  - Core (dynamic): dead bug → bicycle crunch → hollow hold
  - Back: prone Y-T-W raise → superman hold → reverse snow angel
- Each Exercise has a 2-frame stick-figure SVG (start/end position) and text cues.
- **Routines (in code, not editable in-app):** circuit format — 90 s Warm-up, then 4 Slots × 3 Rounds, rest between Exercises and between Rounds; ~11–13 min.
  - A — Push & core: Push, Squat, Core (hold), Back
  - B — Legs & back: Lunge, Hinge, Push, Core (dynamic)
  - C — Full body: Squat, Push, Back, Core (hold)
  - Short Routine: Squat, Push, Core (hold) × 1 Round, no Warm-up (~2–3 min)
- **Rotation** A → B → C advances only when a full Routine is finished. The Short Routine never advances it.
- **Slots** name a Progression; the user's Progression Step picks the Exercise. One Step + one Target per Progression, shared by all Routines.
- **Ratings:** once per Exercise, after the last Round: too easy / ok / too hard.
- **Adjustments** (suggested, accept or dismiss): after N (default 2) identical Ratings in a row:
  - too easy: +2 reps / +5 s; at the ceiling (12 reps / 60 s) → next Step at its start Target.
  - too hard: −2 reps / −5 s; below the floor (4 reps / 10 s) → previous Step near its ceiling.
- **Placement** on first run: push-ups (0 / 1–5 / 6–15 / 15+), squats (<10 / 10–25 / 25+), plank (<20 s / 20–45 s / 45 s+), Reminder time, Rotation start. Re-runnable from Settings (warns that it overwrites Steps).

## Sessions

- Full-screen player: illustration, cues, reps target (tap Done) or countdown (Holds), Skip, Pause.
- A Session counts once the end is reached, even with skipped Exercises (skips are logged). Abandoned Sessions don't count; the app offers the Short Routine instead.
- An interrupted Session can be resumed the same calendar day.
- No backfilling Sessions.
- End of Session: Ratings → Weigh-in prompt → new Achievements / suggested Adjustments.

## Consistency

- A **Completed Day** is a local calendar day (midnight–midnight) with at least one finished Session.
- **Streak** = consecutive Completed Days. Frozen days keep it alive but don't increment it.
- **Freezes:** 1 granted each Monday (and on the first day), bank max 2, auto-used on a missed day while a Streak is alive. Freeze settings changes take effect from the next Monday (per-week snapshot).
- **Reminder** (default 07:30) daily; **nudge** (default 09:00) only if no Session finished yet that day. Both editable/disable-able.
- **Achievements:** Streak 3/7/14/30/60/100; Sessions 10/50/100/250; Weigh-ins in a row 7/30; Progression unlocks (one per Exercise beyond the first step, via accepted Adjustments); Comeback (first Completed Day after a Streak reset).

## Weight

- At most one Weigh-in per day in kg; later entry replaces earlier. Edit, delete and backfill allowed; future days rejected; 20–400 kg.
- Chart: raw points + 7-day moving average.

## Screens

Today · Session player · Progress (weight chart, calendar of completed/frozen/missed days, current Steps) · Achievements · Settings.

## Settings

Reminder on/time, nudge on/time · Freezes on/per week/max banked · Adjustments on/ratings in a row/increments/ceilings/floors · rest between Exercises, rest between Rounds, Warm-up on/off, cue (beep/vibrate/both/none), keep screen awake · Weigh-in prompt after Session · export/import JSON, reset all data · redo Placement.

## Architecture

- Pure TypeScript domain module (`src/domain`, no React/Expo imports), unit-tested with Vitest; "today" is always passed in.
- Append-only event log in expo-sqlite is the source of truth; Streak, Freezes, Rotation, Steps and Achievements are derived (ADR 0001).
- Backup = JSON of settings + event log; export files are git-ignored.
