import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { BottomSheet } from '@/components/BottomSheet';
import { OnboardingCta } from '@/features/onboarding/OnboardingCta';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { colors, palette } from '@/theme/tokens';

const QUICK_HOURS = [6, 12, 24] as const;
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

type Props = {
  startTime: string | null;
  durationMinutes: number | null;
  onChange: (patch: { startTime?: string | null; durationMinutes?: number | null }) => void;
};

/** Início e duração da tela 20: campos lado a lado e atalhos de 6h, 12h, 24h ou Outro. */
export function ScheduleFields({ startTime, durationMinutes, onChange }: Props) {
  const { t } = useTranslation('onboarding');
  const type = useBrandTypography();
  const [pickingTime, setPickingTime] = useState(false);
  // O giro da roda só vale quando a pessoa confirma; fechar a folha descarta.
  const [pendingTime, setPendingTime] = useState(() => timeToDate(startTime));
  const [customHours, setCustomHours] = useState(false);

  const hours = durationMinutes === null ? null : Math.round(durationMinutes / 60);
  const isQuick = hours !== null && (QUICK_HOURS as readonly number[]).includes(hours);

  function openTimePicker() {
    setPendingTime(timeToDate(startTime));
    setPickingTime(true);
  }

  function confirmTime() {
    onChange({ startTime: dateToTime(pendingTime) });
    setPickingTime(false);
  }

  function setHours(value: number) {
    onChange({ durationMinutes: Math.min(MAX_HOURS, Math.max(MIN_HOURS, value)) * 60 });
  }

  return (
    <View style={styles.block}>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('firstWork.when.pickStart')}
          accessibilityValue={{ text: startTime ?? '' }}
          onPress={openTimePicker}
          testID="work-start-field"
          style={({ pressed }) => [styles.field, pressed && styles.pressed]}
        >
          <AppText variant="technical" style={styles.fieldLabel}>
            {t('firstWork.when.start')}
          </AppText>
          <AppText style={[type.heading1, styles.fieldValue]}>{startTime ?? '--:--'}</AppText>
        </Pressable>

        <View style={styles.field}>
          <AppText variant="technical" style={styles.fieldLabel}>
            {t('firstWork.when.duration')}
          </AppText>
          <AppText style={[type.heading1, styles.fieldValue]}>
            {hours === null ? '--' : t('firstWork.when.durationHours', { hours })}
          </AppText>
        </View>
      </View>

      {Platform.OS === 'ios' ? (
        // Folha própria: a roda de horário não cabe na tela, que não rola, sem cobrir o botão.
        <BottomSheet
          open={pickingTime}
          onClose={() => setPickingTime(false)}
          accessibilityLabel={t('firstWork.when.pickStart')}
          testID="work-start-sheet"
        >
          <AppText style={[type.heading1, styles.sheetTitle]}>
            {t('firstWork.when.startSheetTitle')}
          </AppText>
          <View style={styles.picker} testID="work-start-picker">
            <DateTimePicker
              accessibilityLabel={t('firstWork.when.pickStart')}
              display="spinner"
              locale="pt-BR"
              minuteInterval={5}
              mode="time"
              onValueChange={(_event, date) => {
                if (date) setPendingTime(date);
              }}
              testID="work-start-picker-input"
              themeVariant="light"
              value={pendingTime}
            />
          </View>
          <OnboardingCta
            label={t('firstWork.when.confirmStart')}
            onPress={confirmTime}
            testID="work-start-confirm"
          />
        </BottomSheet>
      ) : (
        // Android abre o próprio diálogo do sistema.
        pickingTime && (
          <DateTimePicker
            accessibilityLabel={t('firstWork.when.pickStart')}
            minuteInterval={5}
            mode="time"
            onDismiss={() => setPickingTime(false)}
            onValueChange={(_event, date) => {
              setPickingTime(false);
              if (date) onChange({ startTime: dateToTime(date) });
            }}
            testID="work-start-picker-input"
            value={timeToDate(startTime)}
          />
        )
      )}

      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={t('firstWork.when.duration')}
        style={styles.chips}
      >
        {QUICK_HOURS.map((value) => (
          <Pressable
            key={value}
            accessibilityRole="radio"
            accessibilityLabel={t('firstWork.when.durationHours', { hours: value })}
            accessibilityState={{ checked: hours === value }}
            onPress={() => {
              setCustomHours(false);
              setHours(value);
            }}
            testID={`work-duration-${value}`}
            style={({ pressed }) => [
              styles.chip,
              hours === value ? styles.chipOn : styles.chipOff,
              pressed && styles.pressed,
            ]}
          >
            <AppText
              style={[type.heading1, hours === value ? styles.chipOnText : styles.chipOffText]}
            >
              {t('firstWork.when.durationHours', { hours: value })}
            </AppText>
          </Pressable>
        ))}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('firstWork.when.durationOther')}
          accessibilityState={{ expanded: customHours || (hours !== null && !isQuick) }}
          onPress={() => {
            setCustomHours(true);
            if (hours === null || isQuick) setHours(8);
          }}
          testID="work-duration-other"
          style={({ pressed }) => [
            styles.chip,
            hours !== null && !isQuick ? styles.chipOn : styles.chipOff,
            pressed && styles.pressed,
          ]}
        >
          <AppText
            style={
              hours !== null && !isQuick ? [type.heading1, styles.chipOnText] : styles.chipOtherText
            }
          >
            {hours !== null && !isQuick
              ? t('firstWork.when.durationHours', { hours })
              : t('firstWork.when.durationOther')}
          </AppText>
        </Pressable>
      </View>

      {(customHours || (hours !== null && !isQuick)) && (
        <View style={styles.stepper} testID="work-duration-stepper">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="-1h"
            onPress={() => setHours((hours ?? 8) - 1)}
            testID="work-duration-minus"
            style={({ pressed }) => [styles.stepperButton, pressed && styles.pressed]}
          >
            <AppText style={[type.heading1, styles.stepperSign]}>{'−'}</AppText>
          </Pressable>
          <AppText style={[type.heading1, styles.stepperValue]}>
            {t('firstWork.when.durationHours', { hours: hours ?? 8 })}
          </AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="+1h"
            onPress={() => setHours((hours ?? 8) + 1)}
            testID="work-duration-plus"
            style={({ pressed }) => [styles.stepperButton, pressed && styles.pressed]}
          >
            <AppText style={[type.heading1, styles.stepperSign]}>{'+'}</AppText>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: 8 },
  row: { flexDirection: 'row', gap: 8 },
  field: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.foreground,
    paddingHorizontal: 14,
    justifyContent: 'center',
    gap: 1,
  },
  fieldLabel: { fontSize: 9, lineHeight: 12, letterSpacing: 1.26, color: palette.sage },
  fieldValue: { fontSize: 16, lineHeight: 20, letterSpacing: 0, color: colors.textPrimary },
  sheetTitle: { fontSize: 20, lineHeight: 24, letterSpacing: -0.4, color: colors.textPrimary },
  picker: { alignItems: 'center' },
  chips: { flexDirection: 'row', gap: 6 },
  chip: { flex: 1, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  chipOn: { borderWidth: 1, borderColor: colors.foreground, backgroundColor: colors.foreground },
  chipOff: { borderWidth: 1, borderColor: 'rgba(16,22,15,0.18)' },
  chipOnText: { fontSize: 14, lineHeight: 18, letterSpacing: 0, color: palette.cream },
  chipOffText: { fontSize: 14, lineHeight: 18, letterSpacing: 0, color: colors.textPrimary },
  chipOtherText: { fontSize: 14, lineHeight: 18, color: colors.textMuted },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 },
  stepperButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16,22,15,0.18)',
  },
  stepperSign: { fontSize: 18, lineHeight: 22, letterSpacing: 0, color: colors.textPrimary },
  stepperValue: {
    minWidth: 56,
    textAlign: 'center',
    fontSize: 18,
    lineHeight: 22,
    letterSpacing: 0,
    color: colors.textPrimary,
  },
  pressed: { opacity: 0.72 },
});
