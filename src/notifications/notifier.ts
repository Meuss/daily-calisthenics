import Constants, { ExecutionEnvironment } from 'expo-constants';
import type * as NotificationsModule from 'expo-notifications';
import type { ScheduledReminder } from './schedule';

const CHANNEL_ID = 'reminders';

// Expo Go (SDK 53+) throws on Android as soon as expo-notifications is imported, so Reminders only exist in a real build.
const Notifications: typeof NotificationsModule | null =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient ? null : require('expo-notifications');

export const remindersAvailable = Notifications !== null;

Notifications?.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

/** The most recent plan handed to syncReminders; re-used once permission is granted. */
let latestPlan: ScheduledReminder[] | undefined;
/** Serializes syncs so a cancelAll from one run never interleaves with another run's schedule loop. */
let chain: Promise<void> = Promise.resolve();

async function ensureChannel(Notifications: typeof NotificationsModule): Promise<void> {
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, { name: 'Reminders', importance: Notifications.AndroidImportance.HIGH });
}

/** Android 13+ only shows the permission prompt once a channel exists. Re-syncs the latest plan once granted. */
export async function ensureNotificationPermission(): Promise<boolean> {
  if (!Notifications) return false;
  await ensureChannel(Notifications);
  const current = await Notifications.getPermissionsAsync();
  const granted = current.granted || (await Notifications.requestPermissionsAsync()).granted;
  if (granted && latestPlan) {
    await syncReminders(latestPlan).catch((error) => console.warn('Could not schedule Reminders', error));
  }
  return granted;
}

async function replaceScheduled(plan: ScheduledReminder[]): Promise<void> {
  if (!Notifications) return;
  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) return;
  await ensureChannel(Notifications);
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const reminder of plan) {
    await Notifications.scheduleNotificationAsync({
      identifier: reminder.id,
      content: { title: reminder.title, body: reminder.body },
      trigger:
        reminder.kind === 'daily'
          ? { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: reminder.hour, minute: reminder.minute, channelId: CHANNEL_ID }
          : { type: Notifications.SchedulableTriggerInputTypes.DATE, date: reminder.date, channelId: CHANNEL_ID },
    });
  }
}

/**
 * Replaces every scheduled notification with the latest plan. Does nothing without permission.
 * Runs are queued one at a time; each run uses the plan that is latest when it starts, so superseded plans are dropped.
 * A failed run rejects its own promise but never blocks the queue.
 */
export function syncReminders(plan: ScheduledReminder[]): Promise<void> {
  latestPlan = plan;
  const run = chain.then(() => replaceScheduled(latestPlan ?? plan));
  chain = run.catch((error) => console.warn('Could not schedule Reminders', error));
  return run;
}
