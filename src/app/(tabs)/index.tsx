import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppData } from '../../data/AppDataProvider';
import { loadResumable } from '../../session/player';
import { todayView } from '../../today/todayView';
import { Body, Button, Card, Muted, Screen, Title } from '../../ui/components';
import { formatDay, formatTarget } from '../../ui/format';
import { colors, font, space } from '../../ui/theme';

export default function TodayScreen() {
  const { events, settings, today, kv } = useAppData();
  const [resumable, setResumable] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setResumable(loadResumable(kv, today) !== null);
    }, [kv, today]),
  );

  const view = useMemo(() => todayView(events, settings, today, resumable), [events, settings, today, resumable]);

  return (
    <Screen>
      <Muted>{formatDay(today)}</Muted>
      <View style={styles.streak}>
        <Text style={styles.hero}>{view.streak}</Text>
        <Body>day Streak</Body>
      </View>
      <Muted>
        Best {view.best} · {view.freezes} Freeze{view.freezes === 1 ? '' : 's'} available
      </Muted>

      {view.resumable && (
        <Card>
          <Body>You have a Session in progress.</Body>
          <Button label="Resume" onPress={() => router.push('/session?resume=1')} />
        </Card>
      )}

      {view.doneToday ? (
        <Card>
          <Title>Done for today ✓</Title>
          <Muted>See you tomorrow morning.</Muted>
          <Button label="Do another Session" variant="secondary" onPress={() => router.push('/session')} />
        </Card>
      ) : (
        <Card>
          <Muted>Today's Routine · about {view.estimatedMinutes} min</Muted>
          <Title>{view.routineName}</Title>
          {view.preview.map((item) => (
            <Body key={item.exerciseId}>• {item.name} · {formatTarget(item.mode, item.target)}</Body>
          ))}
          <Button label="Start" onPress={() => router.push('/session')} />
          <Button label="Short Routine (about 3 min)" variant="secondary" onPress={() => router.push('/session?routine=short')} />
        </Card>
      )}

      <Card>
        <Muted>Weigh-in</Muted>
        {view.weighInToday === null ? (
          <Button label="Log today's weight" variant="secondary" onPress={() => router.push('/weigh-in')} />
        ) : (
          <Body>{view.weighInToday.toFixed(1)} kg today</Body>
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  streak: { flexDirection: 'row', alignItems: 'baseline', gap: space.sm },
  hero: { color: colors.accent, fontSize: font.hero, fontWeight: '800' },
});
