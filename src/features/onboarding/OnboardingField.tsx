import { useRef } from 'react';
import { Pressable, StyleSheet, TextInput, type TextInputProps, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { colors, onboardingProfileMetrics as m, palette } from '@/theme/tokens';

/** Espaço da dica/erro abaixo do campo: o teclado nunca a cobre. */
export const FIELD_HELPER_SPACE = 32;

type Props = Omit<TextInputProps, 'style' | 'accessibilityLabel'> & {
  label: string;
  /** Texto abaixo do campo: dica ou erro (centralizado, como o valor). */
  helper?: string;
  error?: boolean;
};

/**
 * Campo de digitação do onboarding (Nome, Local): rótulo, valor e ajuda centralizados
 * (Onboarding v2). A caixa inteira foca o campo, não só a linha do texto.
 */
export function OnboardingField({ label, helper, error = false, testID, ...input }: Props) {
  const type = useBrandTypography();
  const ref = useRef<TextInput>(null);

  return (
    <View style={styles.block}>
      <Pressable
        accessible={false}
        onPress={() => ref.current?.focus()}
        style={[styles.field, error && styles.fieldError]}
        testID={testID ? `${testID}-field` : undefined}
      >
        <AppText variant="technical" style={styles.label}>
          {label}
        </AppText>
        <TextInput
          {...input}
          ref={ref}
          accessibilityLabel={label}
          selectionColor={palette.bronze}
          style={[type.heading1, styles.input]}
          testID={testID}
        />
      </Pressable>
      {helper ? (
        <AppText
          accessibilityLiveRegion={error ? 'polite' : undefined}
          style={[styles.helper, error && styles.helperError]}
        >
          {helper}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: 8 },
  field: {
    minHeight: m.fieldHeight,
    borderRadius: m.fieldRadius,
    borderWidth: 1,
    borderColor: colors.foreground,
    paddingHorizontal: 18,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  fieldError: { borderColor: colors.errorFill },
  label: {
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.4,
    color: palette.sage,
    textAlign: 'center',
  },
  input: {
    alignSelf: 'stretch',
    fontSize: 19,
    letterSpacing: -0.19,
    color: colors.textPrimary,
    padding: 0,
    textAlign: 'center',
  },
  helper: { fontSize: 13, lineHeight: 18, color: palette.sage, textAlign: 'center' },
  helperError: { color: colors.errorFill },
});
