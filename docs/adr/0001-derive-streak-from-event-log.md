# Derive Streak and Achievements from an event log

We store only what happened (finished Sessions, Weigh-ins, Ratings, accepted Adjustments) as an append-only log, and compute the Streak, Freeze usage, Rotation position and Achievements from it, rather than storing them as mutable counters. This keeps export/import trivial (the log is the whole backup) and makes the tricky date rules testable as pure functions. Because Freeze settings are user-configurable, the Freeze settings in force are snapshotted per week so that changing them later does not rewrite past Streaks.

## Considered options

- **Mutable counters** (store `currentStreak`, `freezesLeft`, earned Achievements directly) — simpler reads, but drifts from reality on bugs, imports, or rule changes, and can't be recomputed.
