import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '@/theme/tokens';
import { AppText } from './AppText';
import { Button } from './Button';

const placeholderRows = ['first', 'second', 'third'] as const;

export type SkeletonProps = {
  layout?: 'summary' | 'list';
  testID?: string;
};

/** Structural first-load placeholder: shapes only, never financial or domain values. */
export function Skeleton({ layout = 'summary', testID }: SkeletonProps) {
  const { t } = useTranslation('components');
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={t('technical.loading')}
      accessibilityState={{ busy: true }}
      testID={testID}
      style={styles.skeleton}
    >
      <View
        accessible={false}
        importantForAccessibility="no-hide-descendants"
        style={styles.placeholderGroup}
      >
        <View style={[styles.placeholder, styles.eyebrow]} />
        <View style={[styles.placeholder, styles.heading]} />
        {layout === 'summary' ? (
          <View style={styles.placeholderCard}>
            <View style={[styles.placeholder, styles.cardLabel]} />
            <View style={[styles.placeholder, styles.cardValue]} />
            <View style={[styles.placeholder, styles.cardDetail]} />
          </View>
        ) : (
          placeholderRows.map((row) => (
            <View key={row} style={styles.placeholderRow}>
              <View style={[styles.placeholder, styles.rowIcon]} />
              <View style={styles.rowLines}>
                <View style={[styles.placeholder, styles.rowTitle]} />
                <View style={[styles.placeholder, styles.rowDetail]} />
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  );
}

export type LoadErrorProps = {
  onRetry: () => void;
  retrying?: boolean;
  testID?: string;
};

/** Show only for failed reads; a valid empty response uses the feature's EmptyState. */
export function LoadError({ onRetry, retrying = false, testID }: LoadErrorProps) {
  const { t } = useTranslation('components');
  return (
    <View accessibilityLiveRegion="polite" testID={testID} style={styles.stateCard}>
      <AppText accessibilityRole="header" variant="heading2">
        {t('technical.loadErrorTitle')}
      </AppText>
      <AppText tone="secondary">{t('technical.loadErrorMessage')}</AppText>
      <Button
        label={t('technical.retry')}
        onPress={onRetry}
        loading={retrying}
        variant="secondary"
        testID="load-error-retry"
      />
    </View>
  );
}

export type MutationErrorProps = {
  /** Offer retry only when the caller can guarantee an idempotent operation. */
  onRetry?: () => void;
  retrying?: boolean;
  testID?: string;
};

/** Inline feedback beside the affected action; it does not own or clear form state. */
export function MutationError({ onRetry, retrying = false, testID }: MutationErrorProps) {
  const { t } = useTranslation('components');
  return (
    <View accessibilityLiveRegion="polite" testID={testID} style={styles.inlineError}>
      <AppText tone="secondary">{t('technical.mutationErrorMessage')}</AppText>
      {onRetry && (
        <Button
          label={t('technical.retry')}
          onPress={onRetry}
          loading={retrying}
          variant="secondary"
          testID="mutation-error-retry"
        />
      )}
    </View>
  );
}

export type OfflineBannerProps = {
  /** True only when previously fetched, in-memory data remains visible. */
  showingCachedData?: boolean;
  testID?: string;
};

/** Status only: this component never queues a write or persists domain data. */
export function OfflineBanner({ showingCachedData = false, testID }: OfflineBannerProps) {
  const { t } = useTranslation('components');
  return (
    <View accessibilityLiveRegion="polite" testID={testID} style={styles.offlineBanner}>
      <AppText variant="technical" style={styles.offlineText}>
        {showingCachedData ? t('technical.offlineStale') : t('technical.offline')}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: { paddingVertical: spacing.lg },
  placeholderGroup: { gap: spacing.md },
  placeholder: { backgroundColor: colors.tabActiveBackground, borderRadius: radius.small },
  eyebrow: { height: 10, width: 80 },
  heading: { height: 28, width: '68%' },
  placeholderCard: {
    minHeight: 148,
    marginTop: spacing.sm,
    padding: spacing.lg,
    gap: spacing.base,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.tabBarBorder,
  },
  cardLabel: { height: 10, width: 112 },
  cardValue: { height: 28, width: '56%' },
  cardDetail: { height: 12, width: '38%' },
  placeholderRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.tabBarBorder,
  },
  rowIcon: { width: 32, height: 32, borderRadius: radius.icon },
  rowLines: { flex: 1, gap: spacing.sm },
  rowTitle: { height: 14, width: '62%' },
  rowDetail: { height: 10, width: '42%' },
  stateCard: {
    padding: spacing.xl,
    gap: spacing.base,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.tabBarBorder,
    backgroundColor: colors.surface,
  },
  inlineError: {
    gap: spacing.md,
    padding: spacing.base,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.tabBarBorder,
    backgroundColor: colors.surface,
  },
  offlineBanner: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderRadius: radius.input,
    backgroundColor: colors.darkBackground,
  },
  offlineText: { color: colors.darkTextPrimary },
});
