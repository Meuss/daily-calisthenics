import { StyleSheet, Text, View } from 'react-native';
import type { DayRecord, LocalDate } from '../domain';
import { calendarWeeks, type CalendarCell } from '../progress/calendar';
import { colors, font, space } from './theme';

const STATUS_COLOR: Record<CalendarCell['status'], string> = {
  completed: colors.accent,
  frozen: colors.frozen,
  missed: colors.missed,
  pending: colors.surfaceRaised,
  none: colors.surfaceRaised,
  future: 'transparent',
};

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function StreakCalendar({ days, today }: { days: DayRecord[]; today: LocalDate }) {
  const weeks = calendarWeeks(days, today);
  return (
    <View style={styles.grid}>
      <View style={styles.week}>
        {WEEKDAYS.map((label, i) => <Text key={i} style={styles.label}>{label}</Text>)}
      </View>
      {weeks.map((week) => (
        <View key={week[0].date} style={styles.week}>
          {week.map((cell) => (
            <View key={cell.date} style={[styles.cell, { backgroundColor: STATUS_COLOR[cell.status] }, cell.date === today && styles.today]} />
          ))}
        </View>
      ))}
      <View style={styles.legend}>
        <Legend color={colors.accent} label="Done" />
        <Legend color={colors.frozen} label="Frozen" />
        <Legend color={colors.missed} label="Missed" />
      </View>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.swatch, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { gap: space.xs },
  week: { flexDirection: 'row', gap: space.xs },
  label: { color: colors.textMuted, fontSize: font.small, flex: 1, textAlign: 'center' },
  cell: { flex: 1, aspectRatio: 1, borderRadius: 6 },
  today: { borderWidth: 2, borderColor: colors.text },
  legend: { flexDirection: 'row', gap: space.md, marginTop: space.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  legendLabel: { color: colors.textMuted, fontSize: font.small },
  swatch: { width: 12, height: 12, borderRadius: 3 },
});
