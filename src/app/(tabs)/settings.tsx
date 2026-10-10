import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { DEFAULT_SETTINGS, backupFileName, parseBackup, serializeBackup, type AppSettings } from '../../domain';
import { pickBackupText, shareBackup } from '../../backup/files';
import { useAppData } from '../../data/AppDataProvider';
import { validateSettings } from '../../data/commands';
import { ensureNotificationPermission } from '../../notifications/notifier';
import { saveSnapshot } from '../../session/player';
import { Button, Card, Choice, Muted, Row, Screen, Stepper, SwitchRow, Title } from '../../ui/components';
import { fromMinutes, toMinutes } from '../../ui/format';
import { colors, font } from '../../ui/theme';

const CUES: { value: AppSettings['session']['cue']; label: string }[] = [
  { value: 'both', label: 'Beep + vibrate' },
  { value: 'beep', label: 'Beep' },
  { value: 'vibrate', label: 'Vibrate' },
  { value: 'none', label: 'Silent' },
];

type SettingsGroup = 'reminder' | 'freeze' | 'adjustments' | 'session' | 'weighIn';

const seconds = (value: number) => `${value} s`;

export default function SettingsScreen() {
  const { events, settings, today, kv, updateSettings, replaceAll } = useAppData();
  const [error, setError] = useState<{ group: SettingsGroup; text: string } | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const change = (next: AppSettings, group: SettingsGroup) => {
    const problem = validateSettings(next);
    setError(problem ? { group, text: problem } : null);
    if (!problem) updateSettings(next);
  };
  const reminder = (patch: Partial<AppSettings['reminder']>) => {
    change({ ...settings, reminder: { ...settings.reminder, ...patch } }, 'reminder');
    if (patch.enabled || patch.nudgeEnabled) {
      ensureNotificationPermission().catch((e) => console.warn('Could not request notification permission', e));
    }
  };
  const freeze = (patch: Partial<AppSettings['freeze']>) => change({ ...settings, freeze: { ...settings.freeze, ...patch } }, 'freeze');
  const adjustments = (patch: Partial<AppSettings['adjustments']>) => change({ ...settings, adjustments: { ...settings.adjustments, ...patch } }, 'adjustments');
  const session = (patch: Partial<AppSettings['session']>) => change({ ...settings, session: { ...settings.session, ...patch } }, 'session');

  const exportBackup = async () => {
    setMessage(null);
    try {
      await shareBackup(backupFileName(today), serializeBackup(settings, events, new Date()));
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Export failed.');
    }
  };

  const importBackup = async () => {
    setMessage(null);
    let text: string | null;
    try {
      text = await pickBackupText();
    } catch {
      setMessage('Could not read that file.');
      return;
    }
    if (text === null) return;
    const result = parseBackup(text, today);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    Alert.alert('Replace all data?', `This replaces everything on this phone with the backup from ${result.backup.exportedAt.slice(0, 10)}.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Replace',
        style: 'destructive',
        onPress: () => {
          replaceAll(result.backup.events, result.backup.settings);
          saveSnapshot(kv, null);
          setMessage('Backup imported.');
        },
      },
    ]);
  };

  const resetAll = () => {
    setMessage(null);
    Alert.alert('Reset all data?', 'This deletes every Session, Weigh-in and Achievement. Export a backup first if you want to keep them.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => {
          replaceAll([], DEFAULT_SETTINGS);
          saveSnapshot(kv, null);
          setMessage('All data reset.');
        },
      },
    ]);
  };

  return (
    <Screen>
      <Title>Settings</Title>

      <Card>
        <Muted>Reminders</Muted>
        {error?.group === 'reminder' && <Text style={styles.error}>{error.text}</Text>}
        <SwitchRow label="Morning Reminder" value={settings.reminder.enabled} onChange={(enabled) => reminder({ enabled })} />
        <Stepper label="Time" value={toMinutes(settings.reminder.time)} min={0} max={1425} step={15} format={fromMinutes} onChange={(m) => reminder({ time: fromMinutes(m) })} />
        <SwitchRow label="Nudge if not done yet" value={settings.reminder.nudgeEnabled} onChange={(nudgeEnabled) => reminder({ nudgeEnabled })} />
        <Stepper label="Nudge time" value={toMinutes(settings.reminder.nudgeTime)} min={0} max={1425} step={15} format={fromMinutes} onChange={(m) => reminder({ nudgeTime: fromMinutes(m) })} />
      </Card>

      <Card>
        <Muted>Freezes</Muted>
        {error?.group === 'freeze' && <Text style={styles.error}>{error.text}</Text>}
        <SwitchRow label="Use Freezes" value={settings.freeze.enabled} onChange={(enabled) => freeze({ enabled })} />
        <Stepper label="Per week" value={settings.freeze.perWeek} min={0} max={7} onChange={(perWeek) => freeze({ perWeek })} />
        <Stepper label="Max saved" value={settings.freeze.maxBanked} min={0} max={7} onChange={(maxBanked) => freeze({ maxBanked })} />
        <Muted>Changes apply from next Monday.</Muted>
      </Card>

      <Card>
        <Muted>Adjustments</Muted>
        {error?.group === 'adjustments' && <Text style={styles.error}>{error.text}</Text>}
        <SwitchRow label="Suggest Adjustments" value={settings.adjustments.enabled} onChange={(enabled) => adjustments({ enabled })} />
        <Stepper label="Same Rating in a row" value={settings.adjustments.ratingsInARow} min={1} max={10} onChange={(ratingsInARow) => adjustments({ ratingsInARow })} />
        <Stepper label="Reps step" value={settings.adjustments.repIncrement} min={1} max={10} onChange={(repIncrement) => adjustments({ repIncrement })} />
        <Stepper label="Reps ceiling" value={settings.adjustments.repCeiling} min={2} max={50} onChange={(repCeiling) => adjustments({ repCeiling })} />
        <Stepper label="Reps floor" value={settings.adjustments.repFloor} min={1} max={49} onChange={(repFloor) => adjustments({ repFloor })} />
        <Stepper label="Hold step" value={settings.adjustments.holdIncrement} min={1} max={30} format={seconds} onChange={(holdIncrement) => adjustments({ holdIncrement })} />
        <Stepper label="Hold ceiling" value={settings.adjustments.holdCeiling} min={5} max={300} step={5} format={seconds} onChange={(holdCeiling) => adjustments({ holdCeiling })} />
        <Stepper label="Hold floor" value={settings.adjustments.holdFloor} min={1} max={295} step={5} format={seconds} onChange={(holdFloor) => adjustments({ holdFloor })} />
      </Card>

      <Card>
        <Muted>Session</Muted>
        {error?.group === 'session' && <Text style={styles.error}>{error.text}</Text>}
        <Stepper label="Rest between Exercises" value={settings.session.restSeconds} min={0} max={300} step={5} format={seconds} onChange={(restSeconds) => session({ restSeconds })} />
        <Stepper label="Rest between Rounds" value={settings.session.roundRestSeconds} min={0} max={600} step={15} format={seconds} onChange={(roundRestSeconds) => session({ roundRestSeconds })} />
        <SwitchRow label="Warm-up" value={settings.session.warmupEnabled} onChange={(warmupEnabled) => session({ warmupEnabled })} />
        <SwitchRow label="Keep screen awake" value={settings.session.keepAwake} onChange={(keepAwake) => session({ keepAwake })} />
        <Row>{CUES.map((c) => <Choice key={c.value} label={c.label} selected={settings.session.cue === c.value} onPress={() => session({ cue: c.value })} />)}</Row>
      </Card>

      <Card>
        <Muted>Weigh-in</Muted>
        {error?.group === 'weighIn' && <Text style={styles.error}>{error.text}</Text>}
        <SwitchRow label="Ask after each Session" value={settings.weighInPromptAfterSession} onChange={(weighInPromptAfterSession) => change({ ...settings, weighInPromptAfterSession }, 'weighIn')} />
      </Card>

      <Card>
        <Muted>Data</Muted>
        <Button label="Redo Placement" variant="secondary" onPress={() => router.push('/placement')} />
        <Button label="Export backup" variant="secondary" onPress={() => void exportBackup()} />
        <Button label="Import backup" variant="secondary" onPress={() => void importBackup()} />
        <Button label="Reset all data" variant="danger" onPress={resetAll} />
        {message && <Muted>{message}</Muted>}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  error: { color: colors.danger, fontSize: font.body },
});
