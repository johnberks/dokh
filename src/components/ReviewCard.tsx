import ArrowRight from 'lucide-react-native/icons/arrow-right';
import Check from 'lucide-react-native/icons/check';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeOut, LinearTransition, ReduceMotion } from 'react-native-reanimated';
import { colors, motion, reviewCardMetrics, shadow, spacing } from '@/theme/tokens';
import { useReducedMotion } from '@/theme/useReducedMotion';
import { AppText } from './AppText';

export type ReviewPreview = {
  id: string;
  type: string;
  title: string;
  value: string;
  state: string;
  accent: 'bronze' | 'structure';
};

export type ReviewCardProps = {
  tone?: 'neutral' | 'attention';
  size?: 'compact' | 'standard' | 'detailed';
  eyebrow?: string;
  icon: ReactNode;
  iconTone?: 'bronze' | 'sage';
  value: string;
  qualifier?: string;
  hint?: string;
  previews?: readonly ReviewPreview[];
  /** Total represented by the card; may exceed the preview objects supplied. */
  totalItems?: number;
  action: { label: string; kind: 'arrow' | 'check' };
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
  accessibilityHint?: string;
  testID?: string;
};

export type ReviewCardEntry = ReviewCardProps & { id: string };
const emptyPreviews: readonly ReviewPreview[] = [];
const reviewExit = FadeOut.duration(motion.reviewRemoval).reduceMotion(ReduceMotion.System);
const reviewLayout = LinearTransition.duration(motion.reviewRemoval).reduceMotion(
  ReduceMotion.System,
);

function ActionGlyph({ kind, busy }: { kind: 'arrow' | 'check'; busy: boolean }) {
  if (busy) return <ActivityIndicator color={colors.accent} size="small" />;
  if (kind === 'check') return <Check color={colors.accent} size={14} strokeWidth={2} />;
  return <ArrowRight color={colors.accent} size={16} strokeWidth={1.8} />;
}

/** Only two visible cards per screen, with at most one attention card first. */
export function selectVisibleReviewCards(cards: readonly ReviewCardEntry[]): ReviewCardEntry[] {
  const attention = cards.find((card) => card.tone === 'attention');
  const neutral = cards.filter((card) => card.tone !== 'attention');
  return attention ? [attention, ...neutral.slice(0, 1)] : neutral.slice(0, 2);
}

export function ReviewCardStack({
  cards,
  testID,
}: {
  cards: readonly ReviewCardEntry[];
  testID?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <View testID={testID} style={styles.stack}>
      {selectVisibleReviewCards(cards).map(({ id, ...card }) => (
        <Animated.View
          key={id}
          layout={reduced ? undefined : reviewLayout}
          exiting={reduced ? undefined : reviewExit}
          collapsable={false}
        >
          <ReviewCard {...card} />
        </Animated.View>
      ))}
    </View>
  );
}

/** Visual action object only. A server-confirmed payment must be removed by its parent. */
export function ReviewCard({
  tone = 'neutral',
  size = 'standard',
  eyebrow,
  icon,
  iconTone = 'bronze',
  value,
  qualifier,
  hint,
  previews = emptyPreviews,
  totalItems,
  action,
  onPress,
  busy = false,
  disabled = false,
  accessibilityHint,
  testID,
}: ReviewCardProps) {
  const { t } = useTranslation('components');
  const isCompact = size === 'compact';
  const isDetailed = size === 'detailed';
  const isAttention = tone === 'attention';
  const blocked = busy || disabled;
  const visiblePreviews = isDetailed ? previews.slice(0, 2) : [];
  const hiddenCount = Math.max(
    0,
    Math.max(totalItems ?? 0, previews.length) - visiblePreviews.length,
  );
  const accessibilityLabel = [action.label, value, qualifier].filter(Boolean).join(', ');

  return (
    <Pressable
      accessible
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: blocked, busy }}
      onPress={onPress}
      disabled={blocked}
      testID={testID}
      style={({ pressed }) => [
        styles.card,
        isCompact ? styles.compactCard : styles.regularCard,
        isDetailed && styles.detailedCard,
        isAttention && styles.attentionCard,
        !isAttention && (isCompact ? shadow.subtle : shadow.raised),
        isAttention && shadow.subtle,
        pressed && !blocked && styles.pressed,
        blocked && styles.blocked,
      ]}
    >
      {isCompact ? (
        <View style={styles.compactContent}>
          <View
            accessible={false}
            style={[
              styles.iconTile,
              styles.compactIconTile,
              iconTone === 'sage' ? styles.sageIconTile : styles.bronzeIconTile,
            ]}
          >
            {icon}
          </View>
          <View style={styles.compactCopy}>
            <AppText numberOfLines={1} variant="heading1" style={styles.compactValue}>
              {value}
            </AppText>
            {qualifier ? (
              <AppText numberOfLines={1} style={styles.compactQualifier}>
                {qualifier}
              </AppText>
            ) : null}
          </View>
          <View accessible={false} style={[styles.actionCircle, styles.compactActionCircle]}>
            <ActionGlyph kind={action.kind} busy={busy} />
          </View>
        </View>
      ) : (
        <>
          <View style={styles.header}>
            <View
              accessible={false}
              style={[
                styles.iconTile,
                isDetailed ? styles.detailedIconTile : styles.regularIconTile,
                isAttention ? styles.attentionIconTile : styles.bronzeIconTile,
              ]}
            >
              {icon}
            </View>
            {eyebrow ? (
              <AppText
                numberOfLines={2}
                variant="technical"
                style={[styles.eyebrow, isAttention && styles.attentionEyebrow]}
              >
                {eyebrow}
              </AppText>
            ) : null}
          </View>

          {isAttention ? (
            <View style={styles.attentionMain}>
              <View style={styles.attentionCopy}>
                {qualifier ? (
                  <AppText numberOfLines={2} variant="heading1" style={styles.attentionTitle}>
                    {qualifier}
                  </AppText>
                ) : null}
                {hint ? (
                  <AppText numberOfLines={1} style={styles.hint}>
                    {hint}
                  </AppText>
                ) : null}
              </View>
              <AppText numberOfLines={1} variant="heading1" style={styles.attentionValue}>
                {value}
              </AppText>
            </View>
          ) : (
            <View style={styles.main}>
              <View style={styles.valueLine}>
                <AppText
                  numberOfLines={1}
                  variant="heading1"
                  style={isDetailed ? styles.detailedValue : styles.standardValue}
                >
                  {value}
                </AppText>
                {qualifier ? (
                  <AppText numberOfLines={2} style={styles.qualifier}>
                    {qualifier}
                  </AppText>
                ) : null}
              </View>
              {hint ? (
                <AppText numberOfLines={2} style={styles.hint}>
                  {hint}
                </AppText>
              ) : null}
            </View>
          )}

          {visiblePreviews.length > 0 ? (
            <View style={styles.previewTray}>
              {visiblePreviews.map((preview) => (
                <View key={preview.id} style={styles.preview}>
                  <View
                    style={[
                      styles.previewBar,
                      preview.accent === 'bronze' ? styles.bronzeBar : styles.structureBar,
                    ]}
                  />
                  <View style={styles.previewCopy}>
                    <AppText numberOfLines={1} variant="technical" style={styles.previewType}>
                      {preview.type}
                    </AppText>
                    <AppText numberOfLines={1} variant="heading1" style={styles.previewTitle}>
                      {preview.title}
                    </AppText>
                  </View>
                  <View style={styles.previewEnd}>
                    <AppText numberOfLines={1} variant="heading1" style={styles.previewValue}>
                      {preview.value}
                    </AppText>
                    <AppText numberOfLines={1} variant="technical" style={styles.previewState}>
                      {preview.state}
                    </AppText>
                  </View>
                </View>
              ))}
              {hiddenCount > 0 ? (
                <AppText variant="heading1" style={styles.overflowLabel}>
                  {t(hiddenCount === 1 ? 'reviewCard.oneMoreEntry' : 'reviewCard.moreEntries', {
                    count: hiddenCount,
                  })}
                </AppText>
              ) : null}
            </View>
          ) : null}

          <View
            style={[
              styles.actionRow,
              isDetailed && styles.detailedActionRow,
              isAttention && styles.attentionActionRow,
            ]}
          >
            <AppText variant="heading1" style={styles.actionLabel}>
              {action.label}
            </AppText>
            <View
              accessible={false}
              style={[
                styles.actionCircle,
                isDetailed || isAttention
                  ? styles.detailedActionCircle
                  : styles.regularActionCircle,
              ]}
            >
              <ActionGlyph kind={action.kind} busy={busy} />
            </View>
          </View>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 14 },
  card: {
    minHeight: 44,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.reviewBorder,
  },
  compactCard: {
    borderRadius: reviewCardMetrics.compactRadius,
    paddingTop: reviewCardMetrics.compactPaddingTop,
    paddingBottom: reviewCardMetrics.compactPaddingTop,
    paddingRight: reviewCardMetrics.compactPaddingHorizontal,
    paddingLeft: reviewCardMetrics.compactPaddingLeft,
  },
  regularCard: {
    borderRadius: reviewCardMetrics.regularRadius,
    paddingTop: reviewCardMetrics.regularPaddingTop,
    paddingHorizontal: reviewCardMetrics.regularPaddingHorizontal,
    gap: 12,
  },
  detailedCard: { paddingTop: reviewCardMetrics.detailedPaddingTop, gap: 14 },
  attentionCard: {
    backgroundColor: colors.reviewAttentionBackground,
    borderColor: colors.reviewAttentionBorder,
  },
  pressed: { transform: [{ translateY: 1 }] },
  blocked: { opacity: 0.56 },
  compactContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  compactCopy: { flex: 1, minWidth: 0, gap: 1 },
  iconTile: { alignItems: 'center', justifyContent: 'center', borderRadius: 11 },
  compactIconTile: {
    width: reviewCardMetrics.compactIconTile,
    height: reviewCardMetrics.compactIconTile,
  },
  regularIconTile: {
    width: reviewCardMetrics.regularIconTile,
    height: reviewCardMetrics.regularIconTile,
    borderRadius: 10,
  },
  detailedIconTile: {
    width: reviewCardMetrics.detailedIconTile,
    height: reviewCardMetrics.detailedIconTile,
  },
  bronzeIconTile: { backgroundColor: colors.reviewIconBronzeBackground },
  sageIconTile: { backgroundColor: colors.reviewIconSageBackground },
  attentionIconTile: { backgroundColor: colors.reviewAttentionIconBackground },
  compactValue: { fontSize: 15, lineHeight: 18, letterSpacing: -0.15 },
  compactQualifier: { fontSize: 13, lineHeight: 17, color: colors.textMuted },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  eyebrow: {
    flex: 1,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.8,
    color: colors.darkTextSecondary,
  },
  attentionEyebrow: { color: colors.reviewBronzeText },
  main: { gap: 6 },
  valueLine: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  standardValue: { fontSize: 30, lineHeight: 30, letterSpacing: -0.9 },
  detailedValue: { fontSize: 36, lineHeight: 36, letterSpacing: -1.26 },
  qualifier: { flexShrink: 1, fontSize: 14, lineHeight: 19, color: colors.textMuted },
  hint: { fontSize: 13, lineHeight: 19, color: colors.textMuted },
  attentionMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 12,
  },
  attentionCopy: { flex: 1, minWidth: 0, gap: 3 },
  attentionTitle: { fontSize: 17, lineHeight: 21, letterSpacing: -0.17 },
  attentionValue: { flexShrink: 0, fontSize: 26, lineHeight: 26, letterSpacing: -0.78 },
  previewTray: {
    backgroundColor: colors.reviewTray,
    borderRadius: reviewCardMetrics.trayRadius,
    padding: reviewCardMetrics.trayPadding,
    gap: 6,
  },
  preview: {
    backgroundColor: colors.reviewPreviewSurface,
    borderWidth: 1,
    borderColor: colors.reviewPreviewBorder,
    borderRadius: reviewCardMetrics.previewRadius,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  previewBar: {
    width: reviewCardMetrics.previewBarWidth,
    height: reviewCardMetrics.previewBarHeight,
    borderRadius: 3,
  },
  bronzeBar: { backgroundColor: colors.reviewBronzeText },
  structureBar: { backgroundColor: colors.textSecondary },
  previewCopy: { flex: 1, minWidth: 0, gap: 2 },
  previewType: {
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 1.44,
    color: colors.darkTextSecondary,
  },
  previewTitle: { fontSize: 13, lineHeight: 16, letterSpacing: -0.13 },
  previewEnd: { flexShrink: 0, alignItems: 'flex-end', gap: 2 },
  previewValue: { fontSize: 14, lineHeight: 17 },
  previewState: {
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 1.08,
    color: colors.reviewBronzeText,
  },
  overflowLabel: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
    paddingTop: 8,
    paddingBottom: 6,
    paddingHorizontal: 12,
  },
  actionRow: {
    minHeight: 58,
    marginHorizontal: -reviewCardMetrics.regularPaddingHorizontal,
    paddingHorizontal: reviewCardMetrics.regularPaddingHorizontal,
    borderTopWidth: 1,
    borderTopColor: colors.reviewDivider,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  detailedActionRow: { minHeight: 62 },
  attentionActionRow: { minHeight: 60, borderTopColor: colors.reviewAttentionDivider },
  // Espaçamento neutro: o do título (-1) grudava as palavras de "Adicionar datas".
  actionLabel: { flex: 1, fontSize: 15, lineHeight: 19, letterSpacing: 0.15 },
  actionCircle: {
    borderRadius: 999,
    backgroundColor: colors.darkBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactActionCircle: {
    width: reviewCardMetrics.compactActionCircle,
    height: reviewCardMetrics.compactActionCircle,
  },
  regularActionCircle: {
    width: reviewCardMetrics.regularActionCircle,
    height: reviewCardMetrics.regularActionCircle,
  },
  detailedActionCircle: {
    width: reviewCardMetrics.detailedActionCircle,
    height: reviewCardMetrics.detailedActionCircle,
  },
});
