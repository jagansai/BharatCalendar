import { useEffect, useState } from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  Platform,
  PermissionsAndroid,
  ScrollView,
} from 'react-native';
import { NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, {
  TimestampTrigger,
  TriggerType,
  AndroidImportance,
  AndroidColor,
} from '@notifee/react-native';
import FestivalCalendar from './src/components/FestivalCalendar';
import WidgetView from './src/components/WidgetView';
import language from './src/languages/selected';
import {
  FestivalDay,
  isoDateFromDate,
  parseFestivalDay,
} from './src/utils/festivals';

function getTodayAndNextTwoDates(): string[] {
  const today = new Date();
  return [
    isoDateFromDate(today),
    isoDateFromDate(
      new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
    ),
    isoDateFromDate(
      new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2),
    ),
  ];
}

const allFestivalDays: FestivalDay[] = (
  require('./assets/festivals.json') as unknown[]
)
  .map(parseFestivalDay)
  .filter((day): day is FestivalDay => day !== null);

// Helper to create channel and schedule notification for 6 AM
async function setupNotifee(todayFestivals: string[]) {
  // Create channel (Android)
  await notifee.createChannel({
    id: 'festival-reminder',
    name: language.notificationChannelName,
    importance: AndroidImportance.HIGH,
    lights: true,
    vibration: true,
    badge: true,
    sound: 'default',
    description: language.notificationChannelDescription,
    lightColor: AndroidColor.PURPLE,
  });

  // Request permission (Android 13+)
  await notifee.requestPermission();

  // Cancel all previous triggers
  await notifee.cancelAllNotifications();

  // Schedule notification for 6AM
  const now = new Date();
  let sixAM = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    6,
    0,
    0,
    0,
  );
  if (now > sixAM) {
    sixAM.setDate(sixAM.getDate() + 1);
  }
  const message =
    todayFestivals.length > 0
      ? `${language.notificationToday}: ${todayFestivals.join(', ')}`
      : language.notificationNoFestivals;
  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: sixAM.getTime(),
    repeatFrequency: 1, // DAILY
    alarmManager: true,
  };
  await notifee.createTriggerNotification(
    {
      title: language.notificationTitle,
      body: message,
      android: {
        channelId: 'festival-reminder',
        smallIcon: 'ic_launcher',
        color: '#512da8',
        pressAction: { id: 'default' },
      },
    },
    trigger,
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 18,
    marginTop: 12,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  errorText: { color: '#b91c1c', marginBottom: 12, textAlign: 'center' },
});

const App = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const [festivalDays, setFestivalDays] = useState<FestivalDay[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showWidgetHint, setShowWidgetHint] = useState(false);
  const [canPin, setCanPin] = useState(false);

  useEffect(() => {
    async function setup() {
      // Request notification permission for Android 13+
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        try {
          await PermissionsAndroid.request(
            'android.permission.POST_NOTIFICATIONS',
            {
              title: language.notificationPermissionTitle,
              message: language.notificationPermissionMessage,
              buttonPositive: 'Allow',
              buttonNegative: 'Deny',
            },
          );
        } catch (err) {
          // ignore
        }
      }
      try {
        const wantedDates = getTodayAndNextTwoDates();
        const today = allFestivalDays.filter(
          day => wantedDates[0] === day.isoDate,
        );
        setFestivalDays(today);
        // Schedule notification for 6AM using Notifee
        if (today.length > 0) {
          await setupNotifee(today[0].festivals);
        } else {
          await setupNotifee([]);
        }
      } catch (e) {
        setError('Failed to load festival data.');
      }
      // Widget hint logic
      try {
        const dismissed = await AsyncStorage.getItem('widgetHintDismissed');
        let supported = false;
        if (
          Platform.OS === 'android' &&
          (NativeModules as any).WidgetPin?.isPinSupported
        ) {
          supported = await (NativeModules as any).WidgetPin.isPinSupported();
        }
        setCanPin(supported);
        setShowWidgetHint(!dismissed && supported);
      } catch {}
    }
    setup();
  }, []);

  // Compute next-2-days entries that actually have festivals
  const wantedDates = getTodayAndNextTwoDates();
  const nextTwoDaysWithFestivals = allFestivalDays.filter(
    day =>
      wantedDates.slice(1).includes(day.isoDate) && day.festivals.length > 0,
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? '#111827' : '#f5f7fb' },
      ]}
    >
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text
          style={[styles.header, { color: isDarkMode ? '#f8fafc' : '#1d2433' }]}
        >
          {language.appTitle}
        </Text>
        {error && <Text style={styles.errorText}>{error}</Text>}
        <FestivalCalendar
          festivalDays={allFestivalDays}
          isDarkMode={isDarkMode}
        />
        <WidgetView
          festivalDays={festivalDays}
          nextTwoDaysWithFestivals={nextTwoDaysWithFestivals}
          isDarkMode={isDarkMode}
          showWidgetHint={showWidgetHint}
          canPin={canPin}
          onRequestPin={async () => {
            try {
              await (NativeModules as any).WidgetPin.requestPin();
              await AsyncStorage.setItem('widgetHintDismissed', '1');
              setShowWidgetHint(false);
            } catch {}
          }}
          onDismissHint={async () => {
            await AsyncStorage.setItem('widgetHintDismissed', '1');
            setShowWidgetHint(false);
          }}
        />
      </ScrollView>
    </View>
  );
};

export default App;
