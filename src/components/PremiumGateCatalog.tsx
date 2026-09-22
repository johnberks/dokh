import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { colors, palette, spacing, workLocationColors } from '@/theme/tokens';
import { AppText } from './AppText';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import { PremiumGate } from './PremiumGate';

type Action = 'none' | 'learnMore' | 'free';

/** Agenda 12 (recorrência Free) e 14 (cor Free) dentro da folha padrão. */
export function PremiumGateCatalog() {
  const { t } = useTranslation('components');
  const [open, setOpen] = useState<'repeat' | 'color' | null>(null);
  const [last, setLast] = useState<Action>('none');
  const finish = (action: Action) => {
    setLast(action);
    setOpen(null);
  };

  const repeatOptions = [
    [t('catalog.gateRepeatWeekly'), t('catalog.gateRepeatWeeklyPreview')],
    [t('catalog.gateRepeatBiweekly'), t('catalog.gateRepeatBiweeklyPreview')],
    [t('catalog.gateRepeatMonthly'), t('catalog.gateRepeatMonthlyPreview')],
    [t('catalog.gateRepeatCustom'), ''],
  ] as const;

  const locations = [
    [t('catalog.gateLocationSaoLucas'), workLocationColors.sage],
    [t('catalog.gateLocationCentral'), workLocationColors.bronze],
    [t('catalog.gateLocationSaoCamilo'), workLocationColors.blue],
  ] as const;

  const actionLabel = {
    none: t('catalog.gateActionNone'),
    learnMore: t('catalog.gateActionLearnMore'),
    free: t('catalog.gateActionFree'),
  }[last];

  return (
    <View style={styles.catalog}>
      <AppText accessibilityRole="header" variant="heading2">
        {t('catalog.gateTitle')}
      </AppText>
      <Button
        variant="secondary"
        label={t('catalog.gateOpenRepeat')}
        onPress={() => setOpen('repeat')}
        testID="catalog-gate-open-repeat"
      />
      <Button
        variant="secondary"
        label={t('catalog.gateOpenColor')}
        onPress={() => setOpen('color')}
        testID="catalog-gate-open-color"
      />
      <AppText variant="technical">{t('catalog.gateLastAction', { action: actionLabel })}</AppText>

      <BottomSheet
        open={open === 'repeat'}
        onClose={() => setOpen(null)}
        accessibilityLabel={t('catalog.gateRepeatTitle')}
      >
        <PremiumGate
          title={t('catalog.gateRepeatTitle')}
          description={t('catalog.gateRepeatDescription')}
          fadePreview
          showAvailability
          preview={
            <View style={styles.options}>
              {repeatOptions.map(([label, dates]) => (
                <View key={label} style={styles.option}>
                  <View style={styles.optionStart}>
                    <View style={styles.radio} />
                    <AppText variant="heading2" style={styles.optionLabel}>
                      {label}
                    </AppText>
                  </View>
                  {dates ? (
                    <AppText variant="technical" style={styles.optionDates}>
                      {dates}
                    </AppText>
                  ) : null}
                </View>
              ))}
            </View>
          }
          onLearnMore={() => finish('learnMore')}
          freeExitLabel={t('catalog.gateRepeatExit')}
          onContinueFree={() => finish('free')}
          testID="catalog-gate-repeat"
        />
      </BottomSheet>

      <BottomSheet
        open={open === 'color'}
        onClose={() => setOpen(null)}
        accessibilityLabel={t('catalog.gateColorTitle')}
      >
        <PremiumGate
          title={t('catalog.gateColorTitle')}
          description={t('catalog.gateColorDescription')}
          preview={
            <View style={styles.locations}>
              {locations.map(([name, color], index) => (
                <View
                  key={name}
                  style={[styles.location, index < locations.length - 1 && styles.locationDivider]}
                >
                  <View style={styles.optionStart}>
                    <View style={[styles.locationDot, { backgroundColor: color }]} />
                    <AppText variant="heading2" style={styles.locationName}>
                      {name}
                    </AppText>
                  </View>
                  <View style={styles.swatches}>
                    {[palette.workSage, palette.bronze, palette.workBlue, palette.workTerra].map(
                      (swatch) => (
                        <View key={swatch} style={[styles.swatch, { backgroundColor: swatch }]} />
                      ),
                    )}
                  </View>
                </View>
              ))}
            </View>
          }
          onLearnMore={() => finish('learnMore')}
          freeExitLabel={t('catalog.gateColorExit')}
          onContinueFree={() => finish('free')}
          testID="catalog-gate-color"
        />
      </BottomSheet>
    </View>
  );
}

// Medidas das prévias de Agenda 12/14 (conteúdo da tela, não do gate).
const styles = StyleSheet.create({
  catalog: { gap: spacing.md },
  options: { gap: spacing.sm },
  option: {
    height: 52,
    borderRadius: 16,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.premiumPreviewBorder,
    backgroundColor: colors.premiumPreviewSurface,
  },
  optionStart: { flexDirection: 'row', alignItems: 'center', gap: 14, flexShrink: 1 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.workTypeRadioBorder,
  },
  optionLabel: { fontSize: 16, lineHeight: 20, letterSpacing: 0, color: 'rgba(16,22,15,0.55)' },
  optionDates: { fontSize: 11, letterSpacing: 1.1, color: 'rgba(16,22,15,0.45)' },
  locations: {
    borderRadius: 18,
    paddingVertical: 6,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: colors.premiumPreviewBorder,
    backgroundColor: colors.premiumPreviewSurface,
  },
  location: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationDivider: { borderBottomWidth: 1, borderBottomColor: colors.workCardDivider },
  locationDot: { width: 14, height: 14, borderRadius: 7 },
  locationName: { fontSize: 15, lineHeight: 20, letterSpacing: 0, color: colors.textPrimary },
  swatches: { flexDirection: 'row', gap: 4 },
  swatch: { width: 10, height: 10, borderRadius: 5, opacity: 0.35 },
});
