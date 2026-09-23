import CircleCheck from 'lucide-react-native/icons/circle-check';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { colors, spacing } from '@/theme/tokens';
import { useReducedMotion } from '@/theme/useReducedMotion';
import { AppText } from './AppText';
import { Button } from './Button';
import { HeroBar } from './HeroBar';
import { HeroCarousel } from './HeroCarousel';
import { ReviewCardStack } from './ReviewCard';

/** Interaction proof for 2.7 only; no fictitious payment is inserted into product screens. */
export function MotionCatalog() {
  const { t } = useTranslation('components');
  const reduced = useReducedMotion();
  const [showCard, setShowCard] = useState(true);
  const [page, setPage] = useState(0);
  const pages = [
    {
      id: 'month',
      accessibilityLabel: t('catalog.motionMonth'),
      content: (
        <View style={styles.page}>
          <AppText variant="heading2" style={styles.darkText}>
            {t('catalog.motionMonth')}
          </AppText>
        </View>
      ),
    },
    {
      id: 'history',
      accessibilityLabel: t('catalog.motionHistory'),
      content: (
        <View style={styles.page}>
          <AppText variant="heading2" style={styles.darkText}>
            {t('catalog.motionHistory')}
          </AppText>
          <View style={styles.bars}>
            <HeroBar height={48} width={22} active={page === 1} testID="motion-bar-past" />
            <HeroBar
              height={72}
              width={22}
              current
              active={page === 1}
              testID="motion-bar-current"
            />
          </View>
        </View>
      ),
    },
  ] as const;

  return (
    <View style={styles.container}>
      <AppText accessibilityRole="header" variant="heading2">
        {t('catalog.motionTitle')}
      </AppText>
      <AppText variant="technical">
        {reduced ? t('catalog.motionReduced') : t('catalog.motionStandard')}
      </AppText>
      <HeroCarousel pages={pages} height={160} onPageChange={setPage} testID="motion-carousel" />
      <ReviewCardStack
        cards={
          showCard
            ? [
                {
                  id: 'motion-demo',
                  icon: <CircleCheck color={colors.reviewBronzeText} size={16} />,
                  value: t('catalog.motionCard'),
                  action: { label: t('catalog.motionRemove'), kind: 'check' },
                  onPress: () => setShowCard(false),
                },
              ]
            : []
        }
        testID="motion-card-stack"
      />
      <Button
        label={t('catalog.motionRestore')}
        onPress={() => setShowCard(true)}
        variant="secondary"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.base },
  page: { flex: 1, padding: spacing.xl, gap: spacing.base },
  darkText: { color: colors.darkTextPrimary },
  bars: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-end' },
});
