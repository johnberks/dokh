import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { colors, premiumGateMetrics as m, palette, radius } from '@/theme/tokens';
import { AppText } from './AppText';
import { PremiumBadge, PremiumLockIcon } from './PremiumBadge';

export type PremiumGateProps = {
  /** Benefício em uma frase (ex.: "Cada lugar com a sua cor."). */
  title: string;
  description: string;
  /**
   * Prévia REAL do recurso (as opções de verdade), mostrada esmaecida e sem interação.
   * Nunca números ou dados inventados.
   */
  preview: ReactNode;
  /** Degradê sobre a prévia, como na lista de recorrência (Agenda 12). */
  fadePreview?: boolean;
  /** Pílula "Disponível no Premium" abaixo da prévia (Agenda 12). */
  showAvailability?: boolean;
  /** Leva ao fluxo de benefícios (4 slides) — nunca direto ao paywall (D50). */
  onLearnMore: () => void;
  /** Saída sem custo, sempre presente: o trabalho básico continua sendo salvo. */
  freeExitLabel: string;
  onContinueFree: () => void;
  testID?: string;
};

/**
 * Conteúdo das folhas Free de Agenda 12 (recorrência) e 14 (cor).
 * A tela decide exibir o gate a partir do entitlement; o gate não consulta plano nem bloqueia salvamento.
 */
export function PremiumGate({
  title,
  description,
  preview,
  fadePreview = false,
  showAvailability = false,
  onLearnMore,
  freeExitLabel,
  onContinueFree,
  testID,
}: PremiumGateProps) {
  const { t } = useTranslation('components');

  return (
    <View testID={testID} style={styles.container}>
      <View style={styles.header}>
        <PremiumBadge />
        <AppText accessibilityRole="header" variant="heading1" style={styles.title}>
          {title}
        </AppText>
        <AppText style={styles.description}>{description}</AppText>
      </View>

      <View
        accessible
        accessibilityLabel={t('premium.previewLabel')}
        pointerEvents="none"
        testID={testID ? `${testID}-preview` : undefined}
      >
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {preview}
        </View>
        {fadePreview && (
          <Svg style={StyleSheet.absoluteFill} accessible={false}>
            <Defs>
              <LinearGradient id="premium-fade" x1="0" y1="0" x2="0" y2="1">
                <Stop offset={0} stopColor={palette.cream} stopOpacity={0} />
                <Stop offset={m.previewFadeStart} stopColor={palette.cream} stopOpacity={0} />
                <Stop offset={1} stopColor={palette.cream} stopOpacity={m.previewFadeOpacity} />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" rx={radius.inset} fill="url(#premium-fade)" />
          </Svg>
        )}
      </View>

      {showAvailability && (
        <View testID={testID ? `${testID}-availability` : undefined} style={styles.pill}>
          <PremiumLockIcon color={palette.bronze} size={12} />
          <AppText variant="heading1" style={styles.pillLabel}>
            {t('premium.available')}
          </AppText>
        </View>
      )}

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('premium.learnMore')}
          accessibilityHint={t('premium.learnMoreHint')}
          onPress={onLearnMore}
          testID={testID ? `${testID}-learn-more` : undefined}
          style={({ pressed }) => [styles.cta, pressed && styles.pressed]}
        >
          <AppText variant="heading1" style={styles.ctaLabel}>
            {t('premium.learnMore')}
          </AppText>
          <AppText accessible={false} variant="heading1" style={styles.ctaArrow}>
            {'→'}
          </AppText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={freeExitLabel}
          onPress={onContinueFree}
          testID={testID ? `${testID}-free` : undefined}
          style={({ pressed }) => [styles.exit, pressed && styles.pressed]}
        >
          <AppText variant="heading1" style={styles.exitLabel}>
            {freeExitLabel}
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 18 },
  header: { gap: m.headerGap, paddingTop: m.headerPaddingTop },
  title: {
    fontSize: m.titleSize,
    lineHeight: m.titleLineHeight,
    letterSpacing: m.titleTracking,
    color: colors.textPrimary,
  },
  description: {
    fontSize: m.descriptionSize,
    lineHeight: m.descriptionLineHeight,
    color: colors.textMuted,
  },
  pill: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: m.pillOverlap,
    backgroundColor: colors.foreground,
    borderRadius: radius.pill,
    paddingVertical: m.pillPaddingVertical,
    paddingHorizontal: m.pillPaddingHorizontal,
  },
  pillLabel: {
    fontSize: m.pillFontSize,
    lineHeight: 16,
    letterSpacing: 0,
    color: colors.darkTextPrimary,
  },
  actions: { gap: m.actionsGap },
  cta: {
    minHeight: m.ctaHeight,
    borderRadius: m.ctaRadius,
    backgroundColor: colors.foreground,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  ctaLabel: { fontSize: 16, lineHeight: 20, letterSpacing: 0, color: colors.darkTextPrimary },
  ctaArrow: { fontSize: 16, lineHeight: 20, color: colors.accent },
  exit: { minHeight: m.exitHeight, alignItems: 'center', justifyContent: 'center' },
  exitLabel: { fontSize: 15, lineHeight: 20, letterSpacing: 0, color: colors.textPrimary },
  pressed: { opacity: 0.72 },
});
