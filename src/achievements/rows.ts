import { ACHIEVEMENTS, earnedAchievements, type AchievementDef, type DomainEvent, type LocalDate } from '../domain';

export type AchievementRow = { def: AchievementDef; earnedOn: LocalDate | null };

export function achievementRows(events: DomainEvent[], today: LocalDate): AchievementRow[] {
  const earned = earnedAchievements(events, today);
  const earnedOn = new Map(earned.map((a) => [a.id, a.earnedOn]));
  const byId = new Map(ACHIEVEMENTS.map((def) => [def.id, def]));
  const earnedRows = [...earned].reverse().flatMap((a) => {
    const def = byId.get(a.id);
    return def ? [{ def, earnedOn: a.earnedOn }] : [];
  });
  const lockedRows = ACHIEVEMENTS.filter((def) => !earnedOn.has(def.id)).map((def) => ({ def, earnedOn: null }));
  return [...earnedRows, ...lockedRows];
}
