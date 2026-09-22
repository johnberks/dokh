import Plus from 'lucide-react-native/icons/plus';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { colors, spacing } from '@/theme/tokens';
import { AppText } from './AppText';
import { BottomSheetCatalog } from './BottomSheetCatalog';
import { Button, IconButton } from './Button';
import { CalendarGridCatalog } from './CalendarGridCatalog';
import { EmptyStateCatalog } from './EmptyStateCatalog';
import { Input } from './Input';
import { Card, Divider, Screen, ScrollScreen } from './Layout';
import { MoneyInputCatalog } from './MoneyInputCatalog';
import { PremiumGateCatalog } from './PremiumGateCatalog';
import { ProgressCardCatalog } from './ProgressCardCatalog';
import { ReceivableRowCatalog } from './ReceivableRowCatalog';
import { ReviewCardCatalog } from './ReviewCardCatalog';
import { Chip, SegmentedControl, Toggle } from './Selection';
import { LoadError, MutationError, OfflineBanner, Skeleton } from './TechnicalStates';
import { WorkCardCatalog } from './WorkCardCatalog';
import { WorkTypeSelectorCatalog } from './WorkTypeSelectorCatalog';

/** Internal, non-routed catalog: visual states and accessibility contract for 2.3. */
export function PrimitivesCatalog() {
  const { t } = useTranslation('components');
  const [segment, setSegment] = useState<'monthly' | 'yearly'>('monthly');
  const [enabled, setEnabled] = useState(true);
  const [selected, setSelected] = useState(false);

  return (
    <ScrollScreen>
      <View style={{ gap: spacing.base, paddingVertical: spacing.xl }}>
        <AppText accessibilityRole="header" variant="heading1">
          {t('catalog.title')}
        </AppText>
        <Button label={t('catalog.normal')} onPress={() => {}} />
        <Button label={t('catalog.disabled')} onPress={() => {}} disabled />
        <Button label={t('catalog.loading')} onPress={() => {}} loading />
        <IconButton
          icon={<Plus color={colors.foreground} size={20} />}
          accessibilityLabel={t('catalog.iconButton')}
          onPress={() => {}}
        />
        <Input
          label={t('catalog.field')}
          hint={t('catalog.hint')}
          value=""
          onChangeText={() => {}}
        />
        <Input
          label={t('catalog.field')}
          error={t('catalog.error')}
          value=""
          onChangeText={() => {}}
        />
        <Input label={t('catalog.field')} value="" onChangeText={() => {}} disabled />
        <SegmentedControl
          label={t('catalog.segment')}
          options={[
            { value: 'monthly', label: t('catalog.monthly') },
            { value: 'yearly', label: t('catalog.yearly') },
          ]}
          value={segment}
          onChange={setSegment}
        />
        <Toggle label={t('catalog.toggle')} value={enabled} onValueChange={setEnabled} />
        <Chip
          label={t('catalog.chip')}
          selected={selected}
          onPress={() => setSelected(!selected)}
        />
        <Chip label={t('catalog.disabled')} disabled onPress={() => {}} />
        <Divider />
        <Card>
          <AppText>{t('catalog.card')}</AppText>
        </Card>
        <View style={{ height: 96 }}>
          <Screen>
            <AppText>{t('catalog.screen')}</AppText>
          </Screen>
        </View>
        <Divider />
        <AppText accessibilityRole="header" variant="heading2">
          {t('catalog.technicalStates')}
        </AppText>
        <Skeleton />
        <Skeleton layout="list" />
        <LoadError onRetry={() => {}} />
        <MutationError onRetry={() => {}} />
        <OfflineBanner showingCachedData />
        <Divider />
        <ReviewCardCatalog />
        <Divider />
        <WorkCardCatalog />
        <Divider />
        <ReceivableRowCatalog />
        <Divider />
        <EmptyStateCatalog />
        <Divider />
        <ProgressCardCatalog />
        <Divider />
        <MoneyInputCatalog />
        <Divider />
        <WorkTypeSelectorCatalog />
        <Divider />
        <CalendarGridCatalog />
        <Divider />
        <BottomSheetCatalog />
        <Divider />
        <PremiumGateCatalog />
      </View>
    </ScrollScreen>
  );
}
