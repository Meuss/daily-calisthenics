# Daily Calisthenics

A personal app that guides one person through a short daily bodyweight workout every morning, tracks body weight, and rewards consistency.

## Language

### Training

**Exercise**:
A single bodyweight movement with a short visual explanation (start and end position) and text cues.
_Avoid_: Move, drill

**Routine**:
An ordered list of Exercises, each with a reps target or a hold duration, designed to take about 12 minutes.
_Avoid_: Workout, program, plan

**Slot**:
A position in a Routine that names a Progression rather than a specific Exercise; the user's current Progression Step fills it.

**Target**:
The reps count (or hold seconds, for a Hold) the user aims for on a Progression. It belongs to the user's Progression state, so every Routine shows the same Target for the same Progression.
_Avoid_: Goal, reps setting

**Hold**:
An Exercise performed for time (e.g. plank) rather than for reps.

**Round**:
One pass through every Slot of a Routine; a Routine is a circuit of several Rounds.
_Avoid_: Set, lap

**Rotation**:
The fixed cycle of Routines (e.g. A → B → C) that determines which Routine is offered next.
_Avoid_: Schedule

**Short Routine**:
A deliberately tiny Routine (~3 minutes) for bad days that still counts toward the Streak.
_Avoid_: Fallback workout, mini workout

**Warm-up**:
The short guided block of mobility movements that opens every Routine.

**Progression**:
An ordered ladder of Exercises of increasing difficulty for one movement family (e.g. wall push-up → incline → knee → full → diamond).
_Avoid_: Level, difficulty

**Progression Step**:
The user's current position on a Progression; it determines which Exercise of that family appears in Routines.

**Placement**:
The short first-run questionnaire (e.g. "how many push-ups can you do?") that sets the starting Progression Step for each Progression.
_Avoid_: Onboarding test, assessment

**Session**:
One actual performance of a Routine (or the Short Routine) on a given day. It counts once the end is reached, even if individual Exercises were skipped; an abandoned Session does not count.
_Avoid_: Workout, training

**Rating**:
The user's one-tap verdict on an Exercise after doing it: too easy, ok, or too hard.
_Avoid_: Feedback, score

**Adjustment**:
A change to an Exercise's reps target or Progression Step that the app proposes from Ratings and the user accepts or dismisses.
_Avoid_: Level-up, auto-progression

### Body

**Weigh-in**:
A body weight recorded in kg for a calendar day; at most one per day, a later entry replaces the earlier one.
_Avoid_: Measurement, weight entry

### Consistency

**Completed Day**:
A calendar day on which at least one Session was finished. A Weigh-in alone does not make a Completed Day.

**Streak**:
The number of consecutive Completed Days, where a day covered by a Freeze keeps the Streak alive.

**Freeze**:
A limited allowance that covers one missed day so the Streak does not reset.
_Avoid_: Skip, pass, joker

**Achievement**:
A one-off badge earned by reaching a consistency, volume, Progression, or Weigh-in milestone. No points or levels.
_Avoid_: Trophy, badge, reward

**Comeback**:
An Achievement for starting a new Streak after one was reset.

**Reminder**:
A user-configurable morning notification prompting a Session, plus an optional later nudge that fires only if no Session is finished yet that day.
_Avoid_: Alert, alarm
