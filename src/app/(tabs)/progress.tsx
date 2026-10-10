import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  PROGRESSIONS,
  PROGRESSION_IDS,
  computeStreak,
  deriveLevels,
  deriveWeighIns,
  exerciseFor,
  lastStep,
  movingAverage7,
} from '../../domain';
import { useAppData } from '../../data/AppDataProvider';
import { StreakCalendar } from '../../ui/StreakCalendar';
import { WeightChart } from '../../ui/WeightChart';
import { Body, Button, Card, Muted, Screen, Title } from '../../ui/components';
import { formatDay, formatTarget } from '../../ui/format';
import { space } from '../../ui/theme';

export default function ProgressScreen() {
  const { events, today } = useAppData();
  const weighIns = useMemo(() => deriveWeighIns(events), [events]);
  const averages = useMemo(() => movingAverage7(weighIns), [weighIns]);
  const streak = useMemo(() => computeStreak(events, today), [events, today]);
  const levels = useMemo(() => deriveLevels(events), [events]);
  const latest = weighIns[weighIns.length - 1];
  const latestAverage = averages[averages.length - 1];

  return (
    <Screen>
      <Title>Progress</Title>

      <Card>
        <Muted>Weight</Muted>
        {latest && latestAverage ? (
          <Body>{latest.kg.toFixed(1)} kg · 7-day average {latestAverage.kg.toFixed(1)} kg</Body>
        ) : (
          <Muted>No Weigh-ins yet.</Muted>
        )}
        <WeightChart weighIns={weighIns} today={today} />
        <Button label="Log weight" variant="secondary" onPress={() => router.push('/weigh-in')} />
        {[...weighIns].reverse().slice(0, 10).map((w) => (
          <Pressable key={w.date} style={styles.listRow} onPress={() => router.push(`/weigh-in?date=${w.date}`)}>
            <Body>{formatDay(w.date)}</Body>
            <Body>{w.kg.toFixed(1)} kg</Body>
          </Pressable>
        ))}
      </Card>

      <Card>
        <Muted>Last 5 weeks</Muted>
        <StreakCalendar days={streak.days} today={today} />
      </Card>

      <Card>
        <Muted>Progression Steps</Muted>
        {PROGRESSION_IDS.map((id) => {
          const level = levels[id];
          const exercise = exerciseFor(id, level.step);
          return (
            <View key={id} style={styles.listRow}>
              <View>
                <Body>{exercise.name}</Body>
                <Muted>{PROGRESSIONS[id].name} · Step {level.step + 1} of {lastStep(id) + 1}</Muted>
              </View>
              <Body>{formatTarget(exercise.mode, level.target)}</Body>
            </View>
          );
        })}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  listRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: space.xs },
});
