import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '@/theme/tokens';
import { AppText } from './AppText';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

type BaseProps = {
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  testID?: string;
};

export type ButtonProps = BaseProps & {
  label: string;
  variant?: ButtonVariant;
  accessibilityHint?: string;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  accessibilityHint,
  testID,
}: ButtonProps) {
  const blocked = disabled || loading;
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: blocked, busy: loading }}
      disabled={blocked}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        pressed && !blocked && styles.pressed,
        blocked && styles.disabled,
      ]}
    >
      {loading && (
        <ActivityIndicator color={isPrimary ? colors.darkTextPrimary : colors.foreground} />
      )}
      <AppText style={isPrimary ? styles.primaryLabel : styles.secondaryLabel}>{label}</AppText>
    </Pressable>
  );
}

export type IconButtonProps = BaseProps & {
  icon: ReactNode;
  accessibilityLabel: string;
  accessibilityHint?: string;
};

export function IconButton({
  icon,
  accessibilityLabel,
  accessibilityHint,
  onPress,
  disabled = false,
  loading = false,
  testID,
}: IconButtonProps) {
  const blocked = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: blocked, busy: loading }}
      disabled={blocked}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.iconButton,
        pressed && !blocked && styles.pressed,
        blocked && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.foreground} />
      ) : (
        <View accessible={false}>{icon}</View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.input,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  primary: { backgroundColor: colors.darkBackground },
  secondary: { borderWidth: 1, borderColor: colors.border },
  ghost: { backgroundColor: 'transparent' },
  primaryLabel: { color: colors.darkTextPrimary },
  secondaryLabel: { color: colors.textPrimary },
  iconButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.input,
  },
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.48 },
});
