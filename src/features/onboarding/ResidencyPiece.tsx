import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';
import { AppText } from '@/components/AppText';
import { formatCentsToBRL, parseBRLToCents } from '@/domain/money';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { motion, palette } from '@/theme/tokens';
import { useReducedMotion } from '@/theme/useReducedMotion';

/**
 * A peça da residência (Onboarding v2, 7.7): programa, bolsa e dia de entrada se encaixam
 * enquanto são informados. `dark` sobre o fundo creme da bolsa; `light` no payoff escuro.
 */
export function ResidencyPiece({
  specialty,
  monthlyAmount,
  paymentDay,
  tone = 'dark',
  testID = 'residency-piece',
}: {
  specialty: string;
  /** Texto pt-BR do rascunho; aparece só quando vira um valor válido. */
  monthlyAmount: string;
  paymentDay: number | null;
  tone?: 'dark' | 'light';
  testID?: string;
}) {
  const { t } = useTranslation('onboarding');
  const type = useBrandTypography();
  const reduced = useReducedMotion();
  const dark = tone === 'dark';
  const cents = parseBRLToCents(monthlyAmount);
  const ink = dark ? palette.cream : palette.base;
  const enter = reduced ? undefined : FadeIn.duration(motion.enter);
  const day = paymentDay === null ? null : String(paymentDay).padStart(2, '0');

  return (
    <Animated.View
      layout={reduced ? undefined : LinearTransition.duration(motion.enter)}
      accessible
      accessibilityLabel={[
        t('profile.ready.badge'),
        specialty,
        cents === null ? null : formatCentsToBRL(cents),
        day === null ? null : t('profile.ready.everyDay', { day }),
      ]
        .filter(Boolean)
        .join(', ')}
      style={[styles.piece, dark ? styles.dark : styles.light]}
      testID={testID}
    >
      <View style={styles.row}>
        <View style={styles.chip}>
          <AppText variant="technical" style={styles.chipText}>
            {t('profile.ready.badge')}
          </AppText>
        </View>
        {day !== null && (
          <Animated.View key={day} entering={enter}>
            <AppText style={[type.heading1, styles.day]} testID={`${testID}-day`}>
              {t('profile.ready.everyDay', { day })}
            </AppText>
          </Animated.View>
        )}
      </View>
      <AppText numberOfLines={2} style={[type.heading1, styles.program, { color: ink }]}>
        {specialty}
      </AppText>
      {cents !== null && (
        <Animated.View entering={enter}>
          <AppText
            style={[type.heading1, styles.amount, { color: ink }]}
            testID={`${testID}-amount`}
          >
            {formatCentsToBRL(cents)}
            <AppText
              style={[styles.perMonth, { color: dark ? palette.secondaryText : palette.mutedCopy }]}
            >
              {' /mês'}
            </AppText>
          </AppText>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  piece: { borderRadius: 18, paddingHorizontal: 16, paddingVertical: 14, gap: 6 },
  dark: { backgroundColor: palette.base },
  light: { backgroundColor: palette.cream },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  chip: {
    borderRadius: 999,
    backgroundColor: palette.workSage,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  chipText: { fontSize: 10, lineHeight: 13, letterSpacing: 1.2, color: palette.cream },
  day: { fontSize: 13, lineHeight: 17, letterSpacing: 0, color: palette.bronze },
  program: { fontSize: 17, lineHeight: 21, letterSpacing: -0.17 },
  amount: { fontSize: 22, lineHeight: 26, letterSpacing: -0.44 },
  perMonth: { fontSize: 13, lineHeight: 17, letterSpacing: 0 },
});
