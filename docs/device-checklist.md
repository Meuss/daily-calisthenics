# On-device checklist

Run through this on a real Android phone (Expo Go or an installed APK). There is no emulator in CI.

## First run
- [ ] Fresh install opens on Placement; tabs are not reachable until it's saved.
- [ ] Saving Placement asks for notification permission and lands on Today with "Push & core" (or the chosen Rotation start).

## Session
- [ ] Start → Warm-up counts down with beeps/vibration in the last 3 s and moves on by itself.
- [ ] Reps Exercise waits for Done; Hold counts down; rest shows "Up next" with its illustration.
- [ ] Pause stops the clock; screen stays awake (if enabled).
- [ ] Kill the app mid-Session, reopen the same day → Today offers Resume, Resume continues paused at the same step.
- [ ] Stop → "Do the Short Routine instead" starts a 1-Round Session without Warm-up; "Stop and go back" does not count.
- [ ] Finish → Ratings (default OK) → summary shows the Streak; after two "Too easy" in a row, an Adjustment is suggested; Accept updates the Target on Progress.
- [ ] Weigh-in prompt appears after the Session when none was logged today.

## Today, Progress, Achievements
- [ ] After a Session, Today shows "Done for today" and the next Routine is the next in the Rotation.
- [ ] Weigh-in: log with a comma decimal, backfill yesterday with ‹, edit and delete from Progress.
- [ ] Chart shows dots and the 7-day average line; calendar shows done/frozen/missed days.
- [ ] 3 days in a row earns "3-day Streak" on the Achievements tab.

## Settings and Reminders
- [ ] Change the Reminder time → a notification arrives at that time (may be a few minutes late).
- [ ] Nudge arrives at its time on a day without a Session, and not on a day with one.
- [ ] Setting "Reps floor" above ceiling − step shows an error and is not saved.
- [ ] Export backup → share sheet; Reset all data → back to Placement; Import that backup → history restored.

## Screenshots for the README
- [ ] Take portrait screenshots of Today, a Session (an Exercise with its illustration) and Progress; save them as `docs/screenshots/today.png`, `session.png`, `progress.png`.
