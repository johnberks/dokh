import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Polyline } from 'react-native-svg';
import { AppText } from '@/components/AppText';
import { colors, motion, accountPreviewMetrics as p, palette, shadow } from '@/theme/tokens';
import { useReducedMotion } from '@/theme/useReducedMotion';

const LAYERS = ['shift', 'receivable', 'earnings'] as const;
const EARNINGS_LINE = '0,18 40,15 80,16 120,10 150,7 182,2';

function useReveal(index: number) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(reduced ? 1 : 0);

  useEffect(() => {
    progress.value = reduced
      ? withTiming(1, { duration: motion.instant })
      : withDelay(
          index * p.revealStagger,
          withTiming(1, { duration: motion.enter, easing: Easing.out(Easing.cubic) }),
        );
  }, [index, progress, reduced]);

  return useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * p.revealRise }],
  }));
}

/**
 * Três cartões da tela 04 empilhados. A profundidade vem da ordem das camadas, de sombras
 * crescentes e da entrada em cascata — a geometria e as cores continuam as do HTML.
 */
export function AccountPreview() {
  const { t } = useTranslation('onboarding');
  const shift = useReveal(LAYERS.indexOf('shift'));
  const receivable = useReveal(LAYERS.indexOf('receivable'));
  const earnings = useReveal(LAYERS.indexOf('earnings'));

  return (
    <View
      accessible
      accessibilityLabel={t('welcome.account.preview')}
      style={styles.stack}
      testID="account-preview"
    >
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Animated.View testID="preview-shift" style={[styles.card, styles.shift, shift]}>
          <AppText variant="technical" style={styles.eyebrowDark}>
            {t('welcome.account.shiftLabel')}
          </AppText>
          <AppText variant="heading1" style={styles.shiftPlace}>
            {t('welcome.account.shiftPlace')}
          </AppText>
          <AppText variant="heading1" style={styles.shiftAmount}>
            {t('welcome.account.shiftAmount')}
          </AppText>
        </Animated.View>

        <Animated.View
          testID="preview-receivable"
          style={[styles.card, styles.receivable, receivable]}
        >
          <AppText variant="technical" style={styles.eyebrow}>
            {t('welcome.account.receivableLabel')}
          </AppText>
          <AppText variant="heading1" style={styles.receivableAmount}>
            {t('welcome.account.receivableAmount')}
          </AppText>
          <View style={styles.bars}>
            <View style={[styles.bar, { height: 10, backgroundColor: palette.workSage }]} />
            <View style={[styles.bar, { height: 14, backgroundColor: palette.bronze }]} />
            <View style={[styles.bar, { height: 5, backgroundColor: palette.structure }]} />
          </View>
        </Animated.View>

        <Animated.View testID="preview-earnings" style={[styles.card, styles.earnings, earnings]}>
          <View style={styles.earningsHeader}>
            <AppText variant="technical" style={styles.eyebrow}>
              {t('welcome.account.earningsLabel')}
            </AppText>
            <AppText variant="technical" style={styles.variation}>
              {t('welcome.account.earningsVariation')}
            </AppText>
          </View>
          <AppText variant="heading1" style={styles.earningsAmount}>
            {t('welcome.account.earningsAmount')}
          </AppText>
          <Svg width="100%" height={22} viewBox="0 0 182 22" preserveAspectRatio="none">
            <Polyline
              points={EARNINGS_LINE}
              stroke={palette.bronze}
              strokeWidth={1.5}
              fill="none"
            />
          </Svg>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { flex: 1, minHeight: p.minHeight },
  card: {
    position: 'absolute',
    borderRadius: p.radius,
    paddingVertical: p.paddingVertical,
    paddingHorizontal: p.paddingHorizontal,
    gap: p.gap,
  },
  // Camada 1: sem preenchimento escuro e com a sombra mais leve — fica ao fundo.
  shift: {
    left: 0,
    top: 0,
    width: p.shiftWidth,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.workCardBorder,
    ...shadow.subtle,
  },
  // Camada 2: cartão escuro elevado sobre o primeiro.
  receivable: {
    right: 0,
    top: p.receivableTop,
    width: p.receivableWidth,
    backgroundColor: colors.darkBackground,
    ...shadow.raised,
  },
  // Camada 3: à frente de tudo, com a sombra mais forte do HTML.
  earnings: {
    left: p.earningsLeft,
    top: p.earningsTop,
    width: p.earningsWidth,
    backgroundColor: colors.darkBackground,
    ...shadow.sheet,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.24,
    shadowRadius: 20,
  },
  eyebrow: { fontSize: 10, lineHeight: 14, letterSpacing: 1.8, color: palette.sage },
  eyebrowDark: { fontSize: 10, lineHeight: 14, letterSpacing: 1.8, color: palette.sage },
  shiftPlace: { fontSize: 14, lineHeight: 18, letterSpacing: 0, color: colors.textPrimary },
  shiftAmount: { fontSize: 16, lineHeight: 20, letterSpacing: 0, color: colors.textPrimary },
  receivableAmount: {
    fontSize: 24,
    lineHeight: 26,
    letterSpacing: -0.48,
    color: colors.darkTextPrimary,
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: p.barHeight,
    paddingTop: 4,
  },
  bar: { flex: 1, borderRadius: 2 },
  earningsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  variation: {
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0,
    color: colors.foreground,
    backgroundColor: palette.bronze,
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 6,
    overflow: 'hidden',
  },
  earningsAmount: {
    fontSize: 26,
    lineHeight: 28,
    letterSpacing: -0.52,
    color: colors.darkTextPrimary,
  },
});
