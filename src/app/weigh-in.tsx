import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';
import { addDays, deriveWeighIns, type LocalDate } from '../domain';
import { useAppData } from '../data/AppDataProvider';
import { weighInDeletedEvent, weighInEvent } from '../data/commands';
import { Body, Button, Row, Screen, Title } from '../ui/components';
import { formatDay } from '../ui/format';
import { colors, font, radius, space } from '../ui/theme';

export default function WeighInScreen() {
  const params = useLocalSearchParams<{ date?: string }>();
  const { events, today, append } = useAppData();
  const [date, setDate] = useState<LocalDate>(params.date && params.date <= today ? params.date : today);
  const existing = useMemo(() => deriveWeighIns(events).find((w) => w.date === date)?.kg ?? null, [events, date]);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setText(existing === null ? '' : existing.toFixed(1));
    setError(null);
  }, [existing, date]);

  const save = () => {
    const result = weighInEvent(date, text, new Date());
    if (!result.ok) {
      setError(result.error);
      return;
    }
    append([result.event]);
    router.back();
  };

  const remove = () => {
    append([weighInDeletedEvent(date, new Date())]);
    router.back();
  };

  return (
    <Screen fullScreen>
      <Title>Weigh-in</Title>
      <Row>
        <Button label="‹" variant="secondary" onPress={() => setDate(addDays(date, -1))} />
        <Body>{formatDay(date)}</Body>
        <Button label="›" variant="secondary" disabled={date >= today} onPress={() => setDate(addDays(date, 1))} />
      </Row>
      <TextInput
        value={text}
        onChangeText={setText}
        keyboardType="decimal-pad"
        placeholder="kg"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        autoFocus
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <Button label="Save" onPress={save} />
      {existing !== null && <Button label="Delete this Weigh-in" variant="danger" onPress={remove} />}
      <Button label="Cancel" variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    color: colors.text,
    fontSize: font.clock,
    textAlign: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: space.md,
  },
  error: { color: colors.danger, fontSize: font.body },
});
