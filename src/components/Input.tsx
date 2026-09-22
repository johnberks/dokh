import { StyleSheet, TextInput, type TextInputProps, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme/tokens';
import { AppText } from './AppText';

export type InputProps = Omit<TextInputProps, 'editable' | 'accessibilityLabel'> & {
  label: string;
  hint?: string;
  error?: string;
  disabled?: boolean;
};

export function Input({ label, hint, error, disabled = false, style, ...props }: InputProps) {
  return (
    <View style={styles.field}>
      <AppText variant="label">{label}</AppText>
      <TextInput
        {...props}
        accessibilityLabel={label}
        accessibilityHint={error ?? hint}
        accessibilityState={{ disabled }}
        editable={!disabled}
        placeholderTextColor={colors.textSecondary}
        style={[styles.input, error && styles.inputError, disabled && styles.disabled, style]}
      />
      {error ? (
        <AppText accessibilityLiveRegion="polite" tone="error">
          {error}
        </AppText>
      ) : hint ? (
        <AppText tone="secondary">{hint}</AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.input,
    paddingHorizontal: spacing.md,
    color: colors.textPrimary,
    ...typography.body,
  },
  inputError: { borderColor: colors.errorFill, borderWidth: 2 },
  disabled: { opacity: 0.48 },
});
