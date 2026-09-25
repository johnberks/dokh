import ArrowRight from 'lucide-react-native/icons/arrow-right';
import Check from 'lucide-react-native/icons/check';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { colors, progressCardMetrics } from '@/theme/tokens';
import { AppText } from './AppText';

export type CompletedSetupStep = { id: string; label: string };
export type NextSetupStep = CompletedSetupStep & { onPress: () => void };

export type ProgressCardProps = {
  /** Milestones are selected by the feature; residency must not be assumed for everyone. */
  completed: readonly CompletedSetupStep[];
  totalSteps: number;
  next: NextSetupStep;
  busy?: boolean;
  testID?: string;
};

/** Visual setup progress only: never marks a milestone complete or persists it. */
export function ProgressCard({
  completed,
  totalSteps,
  next,
  busy = false,
  testID,
}: ProgressCardProps) {
  const { t } = useTranslation('home');
  const completedCount = completed.length;

  // UX: once all steps are complete the entire object disappears, not a 100% card.
  if (!Number.isInteger(totalSteps) || totalSteps <= 0 || completedCount >= totalSteps) return null;

  const remaining = totalSteps - completedCount;
  const percentage = Math.round((completedCount / totalSteps) * 100);
  const progressWidth: `${number}%` = `${percentage}%`;

  return (
    <View testID={testID} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headingLine}>
          <AppText variant="technical" style={styles.eyebrow}>
            {t('progress.eyebrow')}
          </AppText>
          <AppText variant="technical" style={styles.count}>
            {t('progress.count', { completed: completedCount, total: totalSteps })}
          </AppText>
        </View>
        <View
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={t('progress.eyebrow')}
          accessibilityValue={{ min: 0, max: totalSteps, now: completedCount }}
          testID={testID ? `${testID}-progress` : undefined}
          style={styles.track}
        >
          <View
            accessible={false}
            testID={testID ? `${testID}-fill` : undefined}
            style={[styles.fill, { width: progressWidth }]}
          />
        </View>
      </View>
      <View style={styles.tray}>
        {completed.map((step) => (
          <View key={step.id} style={styles.completedRow}>
            <View accessible={false} style={styles.completedCircle}>
              <Check color={colors.darkTextPrimary} size={10} strokeWidth={2} />
            </View>
            <AppText style={styles.completedText}>{step.label}</AppText>
          </View>
        ))}
        <Pressable
          accessible
          accessibilityRole="button"
          accessibilityLabel={next.label}
          accessibilityState={{ disabled: busy, busy }}
          disabled={busy}
          onPress={next.onPress}
          testID={testID ? `${testID}-next` : undefined}
          style={({ pressed }) => [styles.nextRow, pressed && !busy && styles.pressed]}
        >
          <View accessible={false} style={styles.pendingCircle} />
          <AppText variant="heading1" style={styles.nextText}>
            {next.label}
          </AppText>
          <View accessible={false} style={styles.actionCircle}>
            {busy ? (
              <ActivityIndicator color={colors.accent} size="small" />
            ) : (
              <ArrowRight color={colors.accent} size={13} strokeWidth={1.8} />
            )}
          </View>
        </Pressable>
      </View>
      <View style={styles.footer}>
        <AppText style={styles.footerText}>
          {remaining === 1
            ? t('progress.remainingOne')
            : t('progress.remainingMany', { count: remaining })}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.progressSurface,
    borderWidth: 1,
    borderColor: colors.progressBorder,
    borderRadius: progressCardMetrics.radius,
    paddingTop: progressCardMetrics.paddingTop,
    paddingHorizontal: progressCardMetrics.paddingHorizontal,
    gap: progressCardMetrics.gap,
  },
  header: { gap: 8 },
  headingLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 8,
  },
  eyebrow: {
    flexShrink: 1,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.8,
    color: colors.textMuted,
  },
  count: {
    flexShrink: 0,
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 0.88,
    color: colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
  track: {
    height: progressCardMetrics.progressHeight,
    borderRadius: 2,
    backgroundColor: colors.progressTrack,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: colors.textPrimary,
  },
  tray: {
    backgroundColor: colors.progressTray,
    borderRadius: progressCardMetrics.trayRadius,
    padding: progressCardMetrics.trayPadding,
    gap: progressCardMetrics.rowGap,
  },
  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  completedCircle: {
    width: progressCardMetrics.completedCircle,
    height: progressCardMetrics.completedCircle,
    borderRadius: progressCardMetrics.completedCircle / 2,
    backgroundColor: colors.darkBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedText: { flex: 1, fontSize: 14, lineHeight: 20, color: colors.textMuted },
  nextRow: {
    minHeight: progressCardMetrics.actionMinHeight,
    backgroundColor: colors.workRowSurface,
    borderWidth: 1,
    borderColor: colors.progressActionBorder,
    borderRadius: progressCardMetrics.actionRadius,
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pressed: { opacity: 0.75 },
  pendingCircle: {
    width: progressCardMetrics.completedCircle,
    height: progressCardMetrics.completedCircle,
    borderRadius: progressCardMetrics.completedCircle / 2,
    borderWidth: 1.5,
    borderColor: colors.progressPendingCircleBorder,
  },
  nextText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.14,
    color: colors.textPrimary,
  },
  actionCircle: {
    width: progressCardMetrics.actionCircle,
    height: progressCardMetrics.actionCircle,
    borderRadius: progressCardMetrics.actionCircle / 2,
    backgroundColor: colors.darkBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.progressFooterBorder,
    marginHorizontal: -progressCardMetrics.paddingHorizontal,
    paddingVertical: 12,
    paddingHorizontal: progressCardMetrics.paddingHorizontal,
  },
  footerText: { fontSize: 13, lineHeight: 19, color: colors.textMuted },
});
