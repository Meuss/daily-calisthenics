import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, font, radius, space } from './theme';

export function Screen({ children, scroll = true, fullScreen = false }: { children: ReactNode; scroll?: boolean; fullScreen?: boolean }) {
  return (
    <SafeAreaView style={styles.screen} edges={fullScreen ? ['top', 'bottom', 'left', 'right'] : ['top', 'left', 'right']}>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">{children}</ScrollView>
      ) : (
        <View style={[styles.content, styles.fill]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function Title({ children }: { children: ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function Body({ children }: { children: ReactNode }) {
  return <Text style={styles.body}>{children}</Text>;
}

export function Muted({ children }: { children: ReactNode }) {
  return <Text style={styles.muted}>{children}</Text>;
}

export function Card({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

export function Row({ children }: { children: ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

type ButtonVariant = 'primary' | 'secondary' | 'danger';

export function Button({ label, onPress, variant = 'primary', disabled = false }: { label: string; onPress: () => void; variant?: ButtonVariant; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.button, styles[variant], pressed && styles.pressed, disabled && styles.disabled]}
    >
      <Text style={[styles.buttonText, variant === 'primary' && styles.primaryText]}>{label}</Text>
    </Pressable>
  );
}

export function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.choice, selected && styles.choiceSelected]}
    >
      <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{label}</Text>
    </Pressable>
  );
}

export function Stepper({ label, value, onChange, min, max, step = 1, format = String }: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  format?: (value: number) => string;
}) {
  return (
    <View style={styles.settingRow}>
      <Text style={[styles.body, styles.fill]}>{label}</Text>
      <Pressable accessibilityLabel={`Decrease ${label}`} onPress={() => onChange(Math.max(min, value - step))} style={styles.stepButton}>
        <Text style={styles.stepText}>−</Text>
      </Pressable>
      <Text style={styles.stepValue}>{format(value)}</Text>
      <Pressable accessibilityLabel={`Increase ${label}`} onPress={() => onChange(Math.min(max, value + step))} style={styles.stepButton}>
        <Text style={styles.stepText}>+</Text>
      </Pressable>
    </View>
  );
}

export function SwitchRow({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  return (
    <View style={styles.settingRow}>
      <Text style={[styles.body, styles.fill]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.border, true: colors.accent }}
        thumbColor={colors.text}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: space.md, gap: space.md },
  fill: { flex: 1 },
  title: { color: colors.text, fontSize: font.title, fontWeight: '700' },
  body: { color: colors.text, fontSize: font.body, lineHeight: 22 },
  muted: { color: colors.textMuted, fontSize: font.small },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: space.md, gap: space.sm, borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  button: { paddingVertical: 14, paddingHorizontal: space.md, borderRadius: radius.sm, alignItems: 'center' },
  primary: { backgroundColor: colors.accent },
  secondary: { backgroundColor: colors.surfaceRaised },
  danger: { backgroundColor: colors.missed },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.4 },
  buttonText: { color: colors.text, fontSize: font.body, fontWeight: '600' },
  primaryText: { color: colors.accentText },
  choice: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceRaised },
  choiceSelected: { borderColor: colors.accent, backgroundColor: colors.accent },
  choiceText: { color: colors.text, fontSize: font.body },
  choiceTextSelected: { color: colors.accentText, fontWeight: '600' },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 44 },
  stepButton: { width: 40, height: 40, borderRadius: radius.sm, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
  stepText: { color: colors.text, fontSize: 22 },
  stepValue: { color: colors.text, fontSize: font.body, minWidth: 56, textAlign: 'center' },
});
