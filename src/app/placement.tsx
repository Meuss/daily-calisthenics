import { router } from 'expo-router';
import { useState } from 'react';
import { ROTATION, ROUTINES, type PlankAnswer, type PushUpAnswer, type RotationRoutineId, type SquatAnswer } from '../domain';
import { useAppData } from '../data/AppDataProvider';
import { hasPlacement, placementEvents } from '../data/commands';
import { ensureNotificationPermission } from '../notifications/notifier';
import { Body, Button, Card, Choice, Muted, Row, Screen, Stepper, Title } from '../ui/components';
import { fromMinutes, toMinutes } from '../ui/format';

const PUSH_UPS: { value: PushUpAnswer; label: string }[] = [
  { value: '0', label: 'None yet' },
  { value: '1-5', label: '1–5' },
  { value: '6-15', label: '6–15' },
  { value: '15+', label: 'More than 15' },
];
const SQUATS: { value: SquatAnswer; label: string }[] = [
  { value: 'under10', label: 'Fewer than 10' },
  { value: '10-25', label: '10–25' },
  { value: '25+', label: 'More than 25' },
];
const PLANKS: { value: PlankAnswer; label: string }[] = [
  { value: 'under20', label: 'Under 20 s' },
  { value: '20-45', label: '20–45 s' },
  { value: '45+', label: 'Over 45 s' },
];

export default function PlacementScreen() {
  const { events, settings, append, updateSettings } = useAppData();
  const redo = hasPlacement(events);
  const [pushUps, setPushUps] = useState<PushUpAnswer | null>(null);
  const [squats, setSquats] = useState<SquatAnswer | null>(null);
  const [plank, setPlank] = useState<PlankAnswer | null>(null);
  const [reminderTime, setReminderTime] = useState(settings.reminder.time);
  const [rotationStart, setRotationStart] = useState<RotationRoutineId>('A');

  const submit = () => {
    if (!pushUps || !squats || !plank) return;
    append(placementEvents({ pushUps, squats, plank }, rotationStart, settings, new Date()));
    updateSettings({ ...settings, reminder: { ...settings.reminder, time: reminderTime } });
    void ensureNotificationPermission();
    router.replace('/');
  };

  return (
    <Screen fullScreen>
      <Title>{redo ? 'Redo Placement' : 'Welcome'}</Title>
      <Body>
        {redo
          ? 'This overwrites your current Progression Steps.'
          : 'Three quick questions set your starting Steps. Be honest: the app adjusts as you go.'}
      </Body>

      <Card>
        <Body>How many push-ups can you do in a row?</Body>
        <Row>{PUSH_UPS.map((o) => <Choice key={o.value} label={o.label} selected={pushUps === o.value} onPress={() => setPushUps(o.value)} />)}</Row>
      </Card>
      <Card>
        <Body>How many squats in a row?</Body>
        <Row>{SQUATS.map((o) => <Choice key={o.value} label={o.label} selected={squats === o.value} onPress={() => setSquats(o.value)} />)}</Row>
      </Card>
      <Card>
        <Body>How long can you hold a plank?</Body>
        <Row>{PLANKS.map((o) => <Choice key={o.value} label={o.label} selected={plank === o.value} onPress={() => setPlank(o.value)} />)}</Row>
      </Card>
      <Card>
        <Stepper label="Morning Reminder" value={toMinutes(reminderTime)} min={0} max={1425} step={15} format={fromMinutes} onChange={(m) => setReminderTime(fromMinutes(m))} />
        <Muted>Start the Rotation with</Muted>
        <Row>{ROTATION.map((id) => <Choice key={id} label={`${id} · ${ROUTINES[id].name}`} selected={rotationStart === id} onPress={() => setRotationStart(id)} />)}</Row>
      </Card>

      <Button label={redo ? 'Save Placement' : 'Start'} disabled={!pushUps || !squats || !plank} onPress={submit} />
      {redo && <Button label="Cancel" variant="secondary" onPress={() => router.back()} />}
    </Screen>
  );
}
