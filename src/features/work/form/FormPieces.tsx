import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { AppText } from '@/components/AppText';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { colors, palette } from '@/theme/tokens';

/** Campo de 60 da Agenda 07: rótulo técnico em cima, valor embaixo, acessório à direita. */
export function FieldBox({
  label,
  value,
  placeholder,
  onPress,
  accessory,
  disabled = false,
  testID,
}: {
  label: string;
  value: string | null;
  placeholder: string;
  onPress: () => void;
  accessory?: ReactNode;
  disabled?: boolean;
  testID?: string;
}) {
  const type = useBrandTypography();
  const filled = value !== null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityValue={{ text: value ?? placeholder }}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.field,
        filled && styles.fieldFilled,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.fieldText}>
        <AppText variant="technical" style={styles.fieldLabel}>
          {label}
        </AppText>
        <AppText
          numberOfLines={1}
          style={filled ? [type.heading1, styles.fieldValue] : styles.fieldPlaceholder}
        >
          {value ?? placeholder}
        </AppText>
      </View>
      {accessory}
    </Pressable>
  );
}

/** Ícone de "Repetir" do HTML (Agenda 07 e 15). */
export function RepeatIcon({
  color = colors.foreground,
  size = 18,
}: {
  color?: string;
  size?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" accessible={false}>
      <Path
        d="M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Linha de 54 abaixo do divisor da Agenda 07 (`Repetir`, `Cor do local`): ícone e rótulo à
 * esquerda, valor e acessório (selo Premium no Free, `›` no Premium) à direita.
 */
export function OptionRow({
  icon,
  label,
  value,
  accessory,
  onPress,
  testID,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  accessory: ReactNode;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityValue={{ text: value }}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [styles.optionRow, pressed && styles.pressed]}
    >
      <View style={styles.optionStart}>
        {icon}
        <AppText variant="heading2" style={styles.optionLabel}>
          {label}
        </AppText>
      </View>
      <View style={styles.optionEnd}>
        <AppText numberOfLines={1} style={styles.optionValue}>
          {value}
        </AppText>
        {accessory}
      </View>
    </Pressable>
  );
}

/** Botão principal escuro de 56; desabilitado fica translúcido, como "Salvar" no design. */
export function DarkButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  testID,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  testID?: string;
}) {
  const type = useBrandTypography();
  const blocked = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: blocked, busy: loading }}
      disabled={blocked}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.button,
        disabled && !loading ? styles.buttonDisabled : styles.buttonEnabled,
        pressed && styles.pressed,
      ]}
    >
      {loading && <ActivityIndicator color={palette.cream} />}
      <AppText style={[type.heading1, styles.buttonLabel]}>{label}</AppText>
    </Pressable>
  );
}

/** Rótulo técnico + título das folhas 08–10. */
export function SheetHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  const type = useBrandTypography();
  return (
    <View style={styles.heading}>
      <AppText variant="technical" style={styles.eyebrow}>
        {eyebrow}
      </AppText>
      <AppText accessibilityRole="header" style={[type.heading1, styles.title]}>
        {title}
      </AppText>
      {description ? <AppText style={styles.description}>{description}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    minHeight: 60,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(16,22,15,0.2)',
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  fieldFilled: { borderColor: colors.foreground },
  fieldText: { flex: 1, gap: 3 },
  fieldLabel: { fontSize: 9, lineHeight: 12, letterSpacing: 1.62, color: palette.sage },
  fieldValue: { fontSize: 16, lineHeight: 20, letterSpacing: 0, color: colors.textPrimary },
  fieldPlaceholder: { fontSize: 16, lineHeight: 20, color: palette.sage },
  disabled: { opacity: 0.48 },
  pressed: { opacity: 0.72 },
  button: {
    minHeight: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  buttonEnabled: { backgroundColor: colors.foreground },
  buttonDisabled: { backgroundColor: 'rgba(16,22,15,0.18)' },
  buttonLabel: { fontSize: 16, lineHeight: 20, letterSpacing: 0, color: palette.cream },
  optionRow: {
    minHeight: 54,
    paddingHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  optionStart: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  optionLabel: { fontSize: 15, lineHeight: 19, letterSpacing: 0, color: colors.textPrimary },
  optionEnd: { flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  optionValue: { flexShrink: 1, fontSize: 14, lineHeight: 18, color: palette.sage },
  heading: { gap: 6, paddingTop: 6 },
  eyebrow: { fontSize: 10, lineHeight: 14, letterSpacing: 1.8, color: palette.sage },
  title: { fontSize: 24, lineHeight: 27, letterSpacing: -0.72, color: colors.textPrimary },
  description: { fontSize: 14, lineHeight: 20, color: palette.mutedCopy },
});
