import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { colors, radius, spacing } from '@/theme/tokens';
import { AppText } from './AppText';

export type SegmentOption<T extends string> = { value: T; label: string };

export type SegmentedControlProps<T extends string> = {
  label: string;
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
};

export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  disabled = false,
}: SegmentedControlProps<T>) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={styles.segmented}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityState={{ selected, disabled }}
            disabled={disabled}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.segment,
              selected && styles.segmentSelected,
              pressed && !disabled && styles.pressed,
              disabled && styles.disabled,
            ]}
          >
            <AppText>{option.label}</AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

export type ToggleProps = {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  hint?: string;
};

export function Toggle({ label, value, onValueChange, disabled = false, hint }: ToggleProps) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleLabel}>
        <AppText>{label}</AppText>
        {hint && <AppText tone="secondary">{hint}</AppText>}
      </View>
      <Switch
        accessibilityLabel={label}
        accessibilityHint={hint}
        accessibilityState={{ disabled, checked: value }}
        value={value}
        disabled={disabled}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.darkBackground }}
        thumbColor={colors.surface}
      />
    </View>
  );
}

export type ChipProps = {
  label: string;
  selected?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  icon?: ReactNode;
};

export function Chip({ label, selected = false, disabled = false, onPress, icon }: ChipProps) {
  const content = (
    <>
      {icon}
      <AppText style={selected && styles.chipSelectedText}>{label}</AppText>
    </>
  );
  if (!onPress) {
    return <View style={[styles.chip, selected && styles.chipSelected]}>{content}</View>;
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        styles.chipInteractive,
        selected && styles.chipSelected,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xs,
  },
  segment: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.small,
    paddingHorizontal: spacing.sm,
  },
  segmentSelected: { backgroundColor: colors.background },
  toggleRow: { flexDirection: 'row', alignItems: 'center', minHeight: 44, gap: spacing.md },
  toggleLabel: { flex: 1 },
  chip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipInteractive: { minHeight: 44 },
  chipSelected: { backgroundColor: colors.darkBackground },
  chipSelectedText: { color: colors.darkTextPrimary },
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.48 },
});
