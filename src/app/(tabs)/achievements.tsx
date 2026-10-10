import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { achievementRows } from '../../achievements/rows';
import { useAppData } from '../../data/AppDataProvider';
import { Body, Muted, Screen, Title } from '../../ui/components';
import { formatDay } from '../../ui/format';
import { colors, radius, space } from '../../ui/theme';

export default function AchievementsScreen() {
  const { events, today } = useAppData();
  const rows = useMemo(() => achievementRows(events, today), [events, today]);
  const earnedCount = rows.filter((r) => r.earnedOn !== null).length;

  return (
    <Screen>
      <Title>Achievements</Title>
      <Muted>{earnedCount} of {rows.length} earned</Muted>
      {rows.map(({ def, earnedOn }) => (
        <View key={def.id} style={[styles.row, earnedOn === null && styles.locked]}>
          <Text style={styles.icon}>{earnedOn === null ? '🔒' : '🏆'}</Text>
          <View style={styles.text}>
            <Body>{def.title}</Body>
            <Muted>{earnedOn === null ? def.description : `Earned ${formatDay(earnedOn)}`}</Muted>
          </View>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, backgroundColor: colors.surface, borderRadius: radius.md },
  locked: { opacity: 0.5 },
  icon: { fontSize: 28 },
  text: { flex: 1 },
});
