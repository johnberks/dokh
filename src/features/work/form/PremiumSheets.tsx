import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { BottomSheet } from '@/components/BottomSheet';
import { PremiumGate } from '@/components/PremiumGate';
import { formatDayMonth, type LocalDate, weekdayShort } from '@/domain/calendar';
import { PREMIUM_COLOR_TOKENS } from '@/features/locations/location-colors';
import type { WorkLocation } from '@/features/locations/locations-data';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { colors, palette, type WorkLocationColorToken, workLocationColors } from '@/theme/tokens';
import type { RepeatFrequency } from '../work-draft';
import { REPEAT_OPTIONS, recurrenceDates, type SeriesFrequency } from '../work-recurrence';
import { DarkButton, SheetHeading } from './FormPieces';

const PREVIEW_COUNT = 3;

/** "Próximos: 21 SET · 28 SET · 5 OUT" — as datas depois da primeira. */
export function nextDatesLabel(frequency: SeriesFrequency, start: LocalDate): string {
  return recurrenceDates(frequency, start, PREVIEW_COUNT + 1)
    .slice(1)
    .map((date) => formatDayMonth(date))
    .join(' · ');
}

function colorOf(token: string): string {
  return workLocationColors[token as WorkLocationColorToken] ?? palette.workSage;
}

/**
 * Agenda 11 (Premium: frequência com as próximas datas) e 12 (Free: prévia real esmaecida,
 * benefício e saída sem recorrência). Nada aqui impede salvar o Trabalho básico.
 */
export function RepeatSheet({
  open,
  isPremium,
  start,
  value,
  onClose,
  onConfirm,
}: {
  open: boolean;
  isPremium: boolean;
  /** Data do trabalho (ou hoje, antes de escolher) — base da prévia. */
  start: LocalDate;
  value: RepeatFrequency;
  onClose: () => void;
  onConfirm: (repeat: RepeatFrequency) => void;
}) {
  const { t } = useTranslation('agenda');
  const type = useBrandTypography();
  const [choice, setChoice] = useState<RepeatFrequency>(value);

  useEffect(() => {
    if (open) setChoice(value);
  }, [open, value]);

  if (!isPremium) {
    const day = start.slice(8);
    const locked: [SeriesFrequency, string][] = [
      ['weekly', Array(PREVIEW_COUNT).fill(weekdayShort(start)).join(' · ')],
      ['biweekly', `${Number(day)} · ${formatDayMonth(recurrenceDates('biweekly', start, 2)[1])}`],
      ['monthly', t('form.repeatSheet.monthlyPreview', { day: Number(day) })],
    ];
    return (
      <BottomSheet
        open={open}
        onClose={onClose}
        accessibilityLabel={t('form.repeatSheet.lockedTitle')}
        testID="work-repeat-sheet"
      >
        <PremiumGate
          title={t('form.repeatSheet.lockedTitle')}
          description={t('form.repeatSheet.lockedDescription')}
          fadePreview
          showAvailability
          preview={
            <View style={styles.options}>
              {locked.map(([frequency, preview]) => (
                <View key={frequency} style={[styles.option, styles.lockedOption]}>
                  <View style={styles.optionStart}>
                    <View style={[styles.radio, styles.lockedRadio]} />
                    <AppText variant="heading2" style={[styles.optionLabel, styles.lockedLabel]}>
                      {t(`form.repeatLabel.${frequency}`)}
                    </AppText>
                  </View>
                  <AppText variant="technical" style={styles.lockedPreview}>
                    {preview}
                  </AppText>
                </View>
              ))}
            </View>
          }
          freeExitLabel={t('form.repeatSheet.exit')}
          onContinueFree={() => onConfirm('none')}
          testID="work-repeat-gate"
        />
      </BottomSheet>
    );
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      accessibilityLabel={t('form.repeatSheet.title')}
      testID="work-repeat-sheet"
    >
      <SheetHeading eyebrow={t('form.repeatSheet.eyebrow')} title={t('form.repeatSheet.title')} />
      <View accessibilityRole="radiogroup" style={styles.options}>
        {REPEAT_OPTIONS.map((frequency) => {
          const selected = choice === frequency;
          const next =
            selected && frequency !== 'none'
              ? t('form.repeatSheet.next', { dates: nextDatesLabel(frequency, start) })
              : null;
          const label = t(`form.repeatLabel.${frequency}`);
          return (
            <Pressable
              key={frequency}
              accessibilityRole="radio"
              accessibilityLabel={next ? `${label}, ${next}` : label}
              accessibilityState={{ checked: selected }}
              onPress={() => setChoice(frequency)}
              testID={`work-repeat-${frequency}`}
              style={({ pressed }) => [
                styles.option,
                selected ? styles.optionOn : styles.optionOff,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.optionStart}>
                <View style={[styles.radio, selected ? styles.radioOn : styles.radioOff]}>
                  {selected && <View style={styles.radioDot} />}
                </View>
                <View style={styles.optionText}>
                  <AppText style={[selected && type.heading1, styles.optionLabel]}>{label}</AppText>
                  {next ? (
                    <AppText style={styles.optionSub} testID="work-repeat-next">
                      {next}
                    </AppText>
                  ) : null}
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>
      {choice !== 'none' && <AppText style={styles.note}>{t('form.repeatSheet.note')}</AppText>}
      <DarkButton
        label={t('form.repeatSheet.confirm')}
        onPress={() => onConfirm(choice)}
        testID="work-repeat-confirm"
      />
    </BottomSheet>
  );
}

/**
 * Agenda 13 (Premium: oito cores, nome e prévia do ponto e do card) e 14 (Free: benefício e
 * `Usar cor automática`). A cor é salva no Local, junto com o Trabalho.
 */
export function ColorSheet({
  open,
  isPremium,
  locationName,
  value,
  previewDate,
  locations,
  onClose,
  onConfirm,
}: {
  open: boolean;
  isPremium: boolean;
  locationName: string;
  /** Cor atual do Local (ou a automática de um Local novo). */
  value: WorkLocationColorToken;
  previewDate: LocalDate;
  locations: readonly WorkLocation[];
  onClose: () => void;
  onConfirm: (token: WorkLocationColorToken | null) => void;
}) {
  const { t } = useTranslation('agenda');
  const type = useBrandTypography();
  const [choice, setChoice] = useState<WorkLocationColorToken>(value);
  const name = locationName.trim() || t('form.colorSheet.newLocation');

  useEffect(() => {
    if (open) setChoice(value);
  }, [open, value]);

  if (!isPremium) {
    const shown = locations.slice(0, 3);
    return (
      <BottomSheet
        open={open}
        onClose={onClose}
        accessibilityLabel={t('form.colorSheet.lockedTitle')}
        testID="work-color-sheet"
      >
        <PremiumGate
          title={t('form.colorSheet.lockedTitle')}
          description={t('form.colorSheet.lockedDescription')}
          preview={
            <View style={styles.locations}>
              {(shown.length > 0
                ? shown.map(
                    (location) => [location.id, location.name, location.colorToken] as const,
                  )
                : [['new', name, value] as const]
              ).map(([id, label, token], index, all) => (
                <View
                  key={id}
                  style={[styles.location, index < all.length - 1 && styles.locationDivider]}
                >
                  <View style={styles.optionStart}>
                    <View style={[styles.locationDot, { backgroundColor: colorOf(token) }]} />
                    <AppText variant="heading2" numberOfLines={1} style={styles.locationName}>
                      {label}
                    </AppText>
                  </View>
                  <View style={styles.fadedSwatches}>
                    {(['sage', 'bronze', 'blue', 'terra'] as const).map((token) => (
                      <View
                        key={token}
                        style={[styles.fadedSwatch, { backgroundColor: workLocationColors[token] }]}
                      />
                    ))}
                  </View>
                </View>
              ))}
            </View>
          }
          freeExitLabel={t('form.colorSheet.exit')}
          onContinueFree={() => onConfirm(null)}
          testID="work-color-gate"
        />
      </BottomSheet>
    );
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      accessibilityLabel={t('form.colorSheet.eyebrow')}
      testID="work-color-sheet"
    >
      <SheetHeading eyebrow={t('form.colorSheet.eyebrow')} title={name} />
      <View accessibilityRole="radiogroup" style={styles.grid}>
        {PREMIUM_COLOR_TOKENS.map((token) => {
          const selected = choice === token;
          const label = t(`form.colors.${token}`);
          return (
            <Pressable
              key={token}
              accessibilityRole="radio"
              accessibilityLabel={label}
              accessibilityState={{ checked: selected }}
              onPress={() => setChoice(token)}
              testID={`work-color-${token}`}
              style={({ pressed }) => [styles.swatchCell, pressed && styles.pressed]}
            >
              <View style={[styles.swatchRing, selected && styles.swatchRingOn]}>
                <View style={[styles.swatch, { backgroundColor: workLocationColors[token] }]} />
              </View>
              <AppText
                variant="technical"
                style={[styles.swatchName, selected && styles.swatchNameOn]}
              >
                {label.toUpperCase()}
              </AppText>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.previewCard} testID="work-color-preview">
        <View style={styles.previewDay}>
          <AppText style={styles.previewDayNumber}>{Number(previewDate.slice(8))}</AppText>
          <View style={[styles.previewDot, { backgroundColor: workLocationColors[choice] }]} />
        </View>
        <View style={styles.previewRule} />
        <View style={styles.previewWork}>
          <View style={[styles.previewBar, { backgroundColor: workLocationColors[choice] }]} />
          <View style={styles.previewText}>
            <AppText numberOfLines={1} style={[type.heading1, styles.previewName]}>
              {name}
            </AppText>
            <AppText style={styles.previewHint}>{t('form.colorSheet.previewHint')}</AppText>
          </View>
        </View>
      </View>
      <DarkButton
        label={t('form.colorSheet.save')}
        onPress={() => onConfirm(choice)}
        testID="work-color-save"
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  options: { gap: 8 },
  option: {
    minHeight: 56,
    borderRadius: 16,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  optionOn: { borderColor: colors.foreground, backgroundColor: '#F6F4EC' },
  optionOff: { borderColor: 'rgba(16,22,15,0.2)' },
  lockedOption: {
    minHeight: 52,
    borderColor: colors.premiumPreviewBorder,
    backgroundColor: colors.premiumPreviewSurface,
  },
  optionStart: { flexDirection: 'row', alignItems: 'center', gap: 14, flexShrink: 1 },
  optionText: { gap: 2, paddingVertical: 14 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { borderColor: colors.foreground },
  radioOff: { borderColor: 'rgba(16,22,15,0.3)' },
  lockedRadio: { borderColor: colors.workTypeRadioBorder },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.foreground },
  optionLabel: { fontSize: 16, lineHeight: 20, letterSpacing: 0, color: colors.textPrimary },
  lockedLabel: { color: 'rgba(16,22,15,0.55)' },
  lockedPreview: { fontSize: 11, lineHeight: 15, letterSpacing: 1.1, color: 'rgba(16,22,15,0.45)' },
  optionSub: { fontSize: 12, lineHeight: 16, color: palette.mutedCopy },
  note: { fontSize: 13, lineHeight: 18, color: palette.mutedCopy },
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
    gap: 12,
  },
  locationDivider: { borderBottomWidth: 1, borderBottomColor: colors.workCardDivider },
  locationDot: { width: 14, height: 14, borderRadius: 7 },
  locationName: {
    flexShrink: 1,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0,
    color: colors.textPrimary,
  },
  fadedSwatches: { flexDirection: 'row', gap: 4 },
  fadedSwatch: { width: 10, height: 10, borderRadius: 5, opacity: 0.35 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 12 },
  swatchCell: { width: '25%', alignItems: 'center', gap: 8 },
  swatchRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchRingOn: { borderColor: colors.foreground },
  swatch: { width: 46, height: 46, borderRadius: 23 },
  swatchName: { fontSize: 9, lineHeight: 12, letterSpacing: 0.9, color: palette.sage },
  swatchNameOn: { color: colors.textPrimary },
  previewCard: {
    backgroundColor: '#F6F4EC',
    borderWidth: 1,
    borderColor: 'rgba(16,22,15,0.14)',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  previewDay: { alignItems: 'center', gap: 4 },
  previewDayNumber: {
    width: 34,
    height: 34,
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: 34,
    fontSize: 15,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  previewDot: { width: 5, height: 5, borderRadius: 2.5 },
  previewRule: { width: 1, height: 36, backgroundColor: 'rgba(16,22,15,0.1)' },
  previewWork: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  previewBar: { width: 4, height: 36, borderRadius: 2 },
  previewText: { flex: 1, gap: 2 },
  previewName: { fontSize: 14, lineHeight: 18, letterSpacing: 0, color: colors.textPrimary },
  previewHint: { fontSize: 12, lineHeight: 16, color: palette.mutedCopy },
  pressed: { opacity: 0.72 },
});
