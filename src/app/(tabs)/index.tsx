import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
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
  const navigating = useRef(false);

  // Ignore repeat taps so one press cannot open two Session players.
  const open = (href: '/session' | '/session?routine=short' | '/session?resume=1') => {
    if (navigating.current) return;
    navigating.current = true;
    router.push(href);
    setTimeout(() => { navigating.current = false; }, 1000);
  };

  useFocusEffect(
    useCallback(() => {
      navigating.current = false;
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
          <Button label="Resume" onPress={() => open('/session?resume=1')} />
        </Card>
      )}

      {view.doneToday ? (
        <Card>
          <Title>Done for today ✓</Title>
          <Muted>See you tomorrow morning.</Muted>
          <Button label="Do another Session" variant="secondary" onPress={() => open('/session')} />
        </Card>
      ) : (
        <Card>
          <Muted>Today's Routine · about {view.estimatedMinutes} min</Muted>
          <Title>{view.routineName}</Title>
          {view.preview.map((item) => (
            <Body key={item.exerciseId}>• {item.name} · {formatTarget(item.mode, item.target)}</Body>
          ))}
          <Button label={view.resumable ? 'Start over' : 'Start'} onPress={() => open('/session')} />
          <Button label="Short Routine (about 3 min)" variant="secondary" onPress={() => open('/session?routine=short')} />
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
