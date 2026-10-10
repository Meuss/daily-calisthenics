import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppDataProvider } from '../data/AppDataProvider';
import { colors } from '../ui/theme';

const theme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: colors.background, card: colors.surface, text: colors.text, border: colors.border, primary: colors.accent },
};

export default function RootLayout() {
  return (
    <AppDataProvider>
      <ThemeProvider value={theme}>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="placement" />
          <Stack.Screen name="session" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
          <Stack.Screen name="weigh-in" options={{ presentation: 'modal' }} />
        </Stack>
      </ThemeProvider>
    </AppDataProvider>
  );
}
