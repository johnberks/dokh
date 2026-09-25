import DateTimePicker from '@react-native-community/datetimepicker';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { BottomSheet } from '@/components/BottomSheet';
import { formatDayMonth, type LocalDate } from '@/domain/calendar';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { colors, palette } from '@/theme/tokens';
import { workEndDescription } from '../work-schedule';
import { DarkButton, SheetHeading } from './FormPieces';

export const QUICK_DURATION_HOURS = [6, 12, 24] as const;
const MIN_HOURS = 1;
const MAX_HOURS = 24;

function timeToDate(time: string | null): Date {
  const [hours, minutes] = (time ?? '19:00').split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function dateToTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/** Roda nativa de horário numa folha; girar sem confirmar não grava. */
export function StartTimeSheet({
  open,
  value,
  optional,
  onClose,
  onConfirm,
}: {
  open: boolean;
  value: string | null;
  /** Procedimento e Atendimento podem remover o horário. */
  optional: boolean;
  onClose: () => void;
  onConfirm: (time: string | null) => void;
}) {
  const { t } = useTranslation('agenda');
  const type = useBrandTypography();
  const [pending, setPending] = useState(() => timeToDate(value));

  useEffect(() => {
    if (open) setPending(timeToDate(value));
  }, [open, value]);

  if (Platform.OS !== 'ios') {
    // Android abre o próprio diálogo do sistema.
    return open ? (
      <DateTimePicker
        mode="time"
        minuteInterval={5}
        value={timeToDate(value)}
        onDismiss={onClose}
        onValueChange={(_event, date) => onConfirm(date ? dateToTime(date) : value)}
      />
    ) : null;
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      accessibilityLabel={t('form.startSheet.title')}
      testID="work-start-sheet"
    >
      <SheetHeading eyebrow={t('form.startSheet.eyebrow')} title={t('form.startSheet.title')} />
      <View style={styles.picker}>
        <DateTimePicker
          accessibilityLabel={t('form.startSheet.title')}
          display="spinner"
          locale="pt-BR"
          minuteInterval={5}
          mode="time"
          onValueChange={(_event, date) => {
            if (date) setPending(date);
          }}
          testID="work-start-picker"
          themeVariant="light"
          value={pending}
        />
      </View>
      <DarkButton
        label={t('form.startSheet.confirm')}
        onPress={() => onConfirm(dateToTime(pending))}
        testID="work-start-confirm"
      />
      {optional && value !== null && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('form.startSheet.clear')}
          onPress={() => onConfirm(null)}
          testID="work-start-clear"
          style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
        >
          <AppText style={[type.heading1, styles.secondaryLabel]}>
            {t('form.startSheet.clear')}
          </AppText>
        </Pressable>
      )}
    </BottomSheet>
  );
}

/**
 * Agenda 09: `Outro` abre um stepper de horas. O término é calculado — nunca digitado — e
 * mostra a data quando atravessa a meia-noite.
 */
export function DurationSheet({
  open,
  valueMinutes,
  workDate,
  startTime,
  onClose,
  onConfirm,
}: {
  open: boolean;
  valueMinutes: number | null;
  workDate: LocalDate | null;
  startTime: string | null;
  onClose: () => void;
  onConfirm: (minutes: number) => void;
}) {
  const { t } = useTranslation('agenda');
  const type = useBrandTypography();
  const initialHours = () => {
    const hours = valueMinutes === null ? null : Math.round(valueMinutes / 60);
    return hours === null || (QUICK_DURATION_HOURS as readonly number[]).includes(hours)
      ? 8
      : hours;
  };
  const [hours, setHours] = useState(initialHours);

  // biome-ignore lint/correctness/useExhaustiveDependencies: reinicia só ao abrir a folha.
  useEffect(() => {
    if (open) setHours(initialHours());
  }, [open]);

  const clamp = (value: number) => Math.min(MAX_HOURS, Math.max(MIN_HOURS, value));
  const end = workEndDescription(workDate, startTime, hours * 60);

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      accessibilityLabel={t('form.durationSheet.title')}
      testID="work-duration-sheet"
    >
      <SheetHeading
        eyebrow={t('form.durationSheet.eyebrow')}
        title={t('form.durationSheet.title')}
      />
      <View style={styles.stepper}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('form.durationSheet.less')}
          disabled={hours <= MIN_HOURS}
          onPress={() => setHours((value) => clamp(value - 1))}
          testID="work-duration-minus"
          style={({ pressed }) => [styles.stepButton, pressed && styles.pressed]}
        >
          <AppText style={[type.heading1, styles.stepSign]}>{'−'}</AppText>
        </Pressable>
        <View
          accessible
          accessibilityLabel={
            hours === 1
              ? t('form.durationSheet.oneHour')
              : t('form.durationSheet.manyHours', { count: hours })
          }
          style={styles.stepValue}
        >
          <AppText style={[type.heading1, styles.stepNumber]} testID="work-duration-value">
            {String(hours)}
          </AppText>
          <AppText style={styles.stepUnit}>
            {hours === 1 ? t('form.durationSheet.hour') : t('form.durationSheet.hours')}
          </AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('form.durationSheet.more')}
          disabled={hours >= MAX_HOURS}
          onPress={() => setHours((value) => clamp(value + 1))}
          testID="work-duration-plus"
          style={({ pressed }) => [
            styles.stepButton,
            styles.stepButtonDark,
            pressed && styles.pressed,
          ]}
        >
          <AppText style={[type.heading1, styles.stepSign, styles.stepSignLight]}>{'+'}</AppText>
        </Pressable>
      </View>
      {end && (
        <View style={styles.endRow}>
          <AppText style={styles.endLabel}>{t('form.durationSheet.endsAt')}</AppText>
          <AppText style={[type.heading1, styles.endValue]} testID="work-duration-end">
            {end.time}
            {end.nextDay ? (
              <AppText style={styles.endDate}>{` · ${formatDayMonth(end.date)}`}</AppText>
            ) : null}
          </AppText>
        </View>
      )}
      <DarkButton
        label={t('form.durationSheet.confirm')}
        onPress={() => onConfirm(hours * 60)}
        testID="work-duration-confirm"
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  picker: { alignItems: 'center' },
  secondary: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  secondaryLabel: { fontSize: 15, lineHeight: 19, letterSpacing: 0, color: colors.textPrimary },
  stepper: {
    backgroundColor: '#F6F4EC',
    borderWidth: 1,
    borderColor: 'rgba(16,22,15,0.14)',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(16,22,15,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepButtonDark: { backgroundColor: colors.foreground, borderColor: colors.foreground },
  stepSign: { fontSize: 22, lineHeight: 24, letterSpacing: 0, color: colors.textPrimary },
  stepSignLight: { color: palette.cream },
  stepValue: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  stepNumber: { fontSize: 40, lineHeight: 44, letterSpacing: -1.6, color: colors.textPrimary },
  stepUnit: { fontSize: 18, lineHeight: 22, color: palette.mutedCopy },
  endRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 4,
  },
  endLabel: { fontSize: 14, lineHeight: 18, color: palette.mutedCopy },
  endValue: { fontSize: 15, lineHeight: 19, letterSpacing: 0, color: colors.textPrimary },
  endDate: { color: palette.sage },
  pressed: { opacity: 0.72 },
});
