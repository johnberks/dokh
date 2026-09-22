import CalendarDays from 'lucide-react-native/icons/calendar-days';
import Check from 'lucide-react-native/icons/check';
import Clock3 from 'lucide-react-native/icons/clock-3';
import Plus from 'lucide-react-native/icons/plus';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { colors } from '@/theme/tokens';
import { AppText } from './AppText';
import { ReviewCard } from './ReviewCard';

const noAction = () => {};

/** Development-only examples transcribed from design/componentes.dc.html, variants A–D. */
export function ReviewCardCatalog() {
  const { t } = useTranslation('components');
  const previews = [
    {
      id: 'procedure',
      type: t('catalog.procedure'),
      title: t('catalog.procedureTitle'),
      value: t('catalog.procedureValue'),
      state: t('catalog.noDate'),
      accent: 'bronze' as const,
    },
    {
      id: 'shift',
      type: t('catalog.shift'),
      title: t('catalog.shiftTitle'),
      value: t('catalog.shiftValue'),
      state: t('catalog.noDate'),
      accent: 'structure' as const,
    },
  ];

  return (
    <View style={{ gap: 14 }}>
      <AppText accessibilityRole="header" variant="heading2">
        {t('catalog.reviewTitle')}
      </AppText>
      <AppText variant="technical">{t('catalog.reviewCompact')}</AppText>
      <ReviewCard
        size="compact"
        iconTone="sage"
        icon={<Plus color={colors.textSecondary} size={17} strokeWidth={1.7} />}
        value={t('catalog.completeFirstWork')}
        qualifier={t('catalog.missingAmount')}
        action={{ label: t('catalog.completeFirstWork'), kind: 'arrow' }}
        onPress={noAction}
        testID="catalog-review-compact"
      />
      <AppText variant="technical">{t('catalog.reviewStandard')}</AppText>
      <ReviewCard
        size="standard"
        icon={<Clock3 color={colors.reviewBronzeText} size={16} strokeWidth={1.7} />}
        eyebrow={t('catalog.awaitingConfirmation')}
        value={t('catalog.standardValue')}
        qualifier={t('catalog.clinic')}
        action={{ label: t('catalog.reviewEntry'), kind: 'arrow' }}
        onPress={noAction}
        testID="catalog-review-standard"
      />
      <AppText variant="technical">{t('catalog.reviewDetailed')}</AppText>
      <ReviewCard
        size="detailed"
        icon={<CalendarDays color={colors.reviewBronzeText} size={17} strokeWidth={1.7} />}
        eyebrow={t('catalog.reviewNeeded')}
        value={t('catalog.detailedValue')}
        qualifier={t('catalog.missingDate')}
        hint={t('catalog.startWithLargest')}
        previews={previews}
        totalItems={5}
        action={{ label: t('catalog.addDates'), kind: 'arrow' }}
        onPress={noAction}
        testID="catalog-review-detailed"
      />
      <AppText variant="technical">{t('catalog.reviewAttention')}</AppText>
      <ReviewCard
        tone="attention"
        icon={<Check color={colors.reviewBronzeText} size={16} strokeWidth={1.8} />}
        eyebrow={t('catalog.todayExpected')}
        value={t('catalog.attentionValue')}
        qualifier={t('catalog.hospital')}
        hint={t('catalog.shiftDate')}
        action={{ label: t('catalog.receivedQuestion'), kind: 'check' }}
        onPress={noAction}
        testID="catalog-review-attention"
      />
    </View>
  );
}
