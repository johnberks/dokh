import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, TextInput, type TextInputProps, View } from 'react-native';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { colors, moneyInputMetrics } from '@/theme/tokens';
import { AppText } from './AppText';

export type MoneyInputVariant = 'form' | 'residency' | 'work';

export type MoneyInputProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  variant?: MoneyInputVariant;
  hint?: string;
  error?: string;
  disabled?: boolean;
  testID?: string;
  onBlur?: TextInputProps['onBlur'];
  /** `center`: rótulo, valor e ajuda centralizados (campos de valor do onboarding). */
  align?: 'start' | 'center';
};

/** Controlled pt-BR text entry. Parse into bigint cents only on validation/submit. */
export function MoneyInput({
  label,
  value,
  onChangeText,
  variant = 'form',
  hint,
  error,
  disabled = false,
  testID,
  onBlur,
  align = 'start',
}: MoneyInputProps) {
  const { t } = useTranslation('components');
  const fonts = useBrandTypography();
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const centered = align === 'center';
  const filled = value.trim().length > 0;
  const detail = error ?? hint;
  const form = variant === 'form';
  const residency = variant === 'residency';
  const size = form
    ? moneyInputMetrics.formValueSize
    : residency
      ? moneyInputMetrics.residencyValueSize
      : moneyInputMetrics.workValueSize;

  return (
    <View style={styles.container} testID={testID}>
      {residency ? (
        <AppText variant="heading1" style={[styles.residencyLabel, centered && styles.centerText]}>
          {label}
        </AppText>
      ) : null}
      <Pressable
        accessible={false}
        // A caixa inteira foca o campo, não só os dígitos.
        onPress={() => inputRef.current?.focus()}
        testID={testID ? `${testID}-field` : undefined}
        style={[
          form ? styles.formField : styles.heroField,
          form && (filled || focused) && styles.formFieldActive,
          error && styles.errorBorder,
          disabled && styles.disabled,
        ]}
      >
        {form ? (
          <AppText variant="technical" style={[styles.formLabel, centered && styles.centerText]}>
            {label}
          </AppText>
        ) : null}
        <View style={[styles.valueRow, centered && styles.valueRowCentered]}>
          <AppText
            accessible={false}
            variant={form ? 'body' : 'heading2'}
            style={[
              styles.currency,
              form && styles.formCurrency,
              !form && {
                fontSize: residency
                  ? moneyInputMetrics.residencyCurrencySize
                  : moneyInputMetrics.workCurrencySize,
              },
            ]}
          >
            {t('money.currency')}
          </AppText>
          <TextInput
            ref={inputRef}
            accessibilityLabel={label}
            accessibilityHint={
              detail ? t('money.currencyHintWithDetail', { detail }) : t('money.currencyHint')
            }
            accessibilityState={{ disabled }}
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect={false}
            editable={!disabled}
            keyboardType="decimal-pad"
            onBlur={(event) => {
              setFocused(false);
              onBlur?.(event);
            }}
            onChangeText={(text) => onChangeText(text.replace(/^\s*R\$\s*/u, ''))}
            onFocus={() => setFocused(true)}
            placeholder={t('money.placeholder')}
            placeholderTextColor={colors.darkTextSecondary}
            selectionColor={colors.accent}
            testID={testID ? `${testID}-input` : undefined}
            underlineColorAndroid="transparent"
            value={value}
            style={[
              styles.input,
              {
                fontFamily: filled ? fonts.heading1.fontFamily : fonts.body.fontFamily,
                fontSize: size,
              },
              form && styles.formInput,
              !form && { lineHeight: size, letterSpacing: -0.035 * size },
              !filled && styles.emptyInput,
              // Centralizado: o campo mede o próprio conteúdo para "R$" e valor andarem juntos.
              centered && styles.inputCentered,
            ]}
          />
        </View>
      </Pressable>
      {error ? (
        <AppText
          accessibilityLiveRegion="polite"
          tone="error"
          style={[styles.helper, centered && styles.centerText]}
        >
          {error}
        </AppText>
      ) : hint ? (
        <AppText style={[styles.helper, styles.hint, centered && styles.centerText]}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  formField: {
    minHeight: moneyInputMetrics.formHeight,
    borderWidth: 1,
    borderColor: colors.moneyFieldBorder,
    borderRadius: moneyInputMetrics.formRadius,
    paddingHorizontal: moneyInputMetrics.formPaddingHorizontal,
    paddingVertical: 8,
    justifyContent: 'center',
    gap: 3,
  },
  formFieldActive: { borderColor: colors.textPrimary },
  formLabel: {
    fontSize: moneyInputMetrics.formLabelSize,
    lineHeight: 12,
    letterSpacing: 1.62,
    color: colors.darkTextSecondary,
  },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  valueRowCentered: { justifyContent: 'center' },
  centerText: { textAlign: 'center' },
  inputCentered: { flex: 0, flexShrink: 1, minWidth: 48 },
  currency: { color: colors.darkTextSecondary, fontVariant: ['tabular-nums'] },
  formCurrency: { fontSize: moneyInputMetrics.formValueSize },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
    padding: 0,
    minWidth: 0,
  },
  formInput: { lineHeight: 20 },
  emptyInput: { color: colors.darkTextSecondary },
  heroField: {
    borderBottomWidth: moneyInputMetrics.heroUnderlineWidth,
    borderBottomColor: colors.textPrimary,
    paddingBottom: 12,
    minHeight: 64,
    justifyContent: 'flex-end',
  },
  residencyLabel: {
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.17,
  },
  helper: { fontSize: 13, lineHeight: 19 },
  hint: { color: colors.darkTextSecondary },
  errorBorder: { borderColor: colors.errorFill, borderBottomColor: colors.errorFill },
  disabled: { opacity: 0.48 },
});
