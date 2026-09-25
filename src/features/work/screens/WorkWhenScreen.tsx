import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import { useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { CalendarGrid } from '@/components/CalendarGrid';
import { monthOf, shiftMonth } from '@/domain/calendar';
import { requiresSchedule } from '@/domain/work-type';
import { OnboardingCta } from '@/features/onboarding/OnboardingCta';
import { OnboardingHeader } from '@/features/onboarding/OnboardingHeader';
import { deviceTimezone } from '@/features/onboarding/profile-data';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { colors, onboardingProfileMetrics as m, palette } from '@/theme/tokens';
import { ScheduleFields } from '../ScheduleFields';
import { WorkTypeChip } from '../WorkTypeChip';
import { useWorkDraft } from '../work-draft';
import { localDateToDate, todayInTimezone, workEndDescription } from '../work-schedule';

const MONTH_LABEL = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' });
const SELECTED_LABEL = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  weekday: 'long',
});

/** Tela 20: data obrigatória; horário e duração só são exigidos em Plantão. */
export function WorkWhenScreen() {
  const { t } = useTranslation('onboarding');
  const type = useBrandTypography();
  const insets = useContext(SafeAreaInsetsContext) ?? { top: 0, bottom: 0 };
  const { type: workType, workDate, startTime, durationMinutes, update } = useWorkDraft();
  const [today] = useState(() => todayInTimezone(deviceTimezone()));
  const [month, setMonth] = useState(() => monthOf(workDate ?? today));
  const [showSchedule, setShowSchedule] = useState(startTime !== null);
  const [touched, setTouched] = useState(false);

  const needsSchedule = workType !== null && requiresSchedule(workType);
  const missingDate = workDate === null;
  const missingSchedule = needsSchedule && (startTime === null || durationMinutes === null);
  const end = workEndDescription(workDate, startTime, durationMinutes);

  function submit() {
    setTouched(true);
    if (missingDate || missingSchedule) return;
    router.push('/work-amount');
  }

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 24) + 20 },
      ]}
      testID="first-work-when"
    >
      <StatusBar style="dark" />
      <OnboardingHeader step={6} onBack={() => router.back()} testID="work-when-header" />

      <View style={styles.heading}>
        {workType && <WorkTypeChip type={workType} />}
        <AppText accessibilityRole="header" style={[type.heading1, styles.title]}>
          {t(
            workType === 'procedure'
              ? 'firstWork.when.titleProcedure'
              : workType === 'appointment'
                ? 'firstWork.when.titleAppointment'
                : 'firstWork.when.titleShift',
          )}
        </AppText>
      </View>

      <View style={styles.body}>
        <View style={styles.monthRow}>
          <AppText style={[type.heading1, styles.monthLabel]}>
            {MONTH_LABEL.format(localDateToDate(`${month}-01`))}
          </AppText>
          <View style={styles.monthControls}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('profile.back')}
              onPress={() => setMonth(shiftMonth(month, -1))}
              testID="work-when-previous-month"
              style={({ pressed }) => [styles.monthButton, pressed && styles.pressed]}
            >
              <ChevronLeft color={palette.sage} size={18} strokeWidth={1.8} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('profile.continue')}
              onPress={() => setMonth(shiftMonth(month, 1))}
              testID="work-when-next-month"
              style={({ pressed }) => [styles.monthButton, pressed && styles.pressed]}
            >
              <ChevronRight color={palette.sage} size={18} strokeWidth={1.8} />
            </Pressable>
          </View>
        </View>

        <CalendarGrid
          density="compact"
          month={month}
          today={today}
          selected={workDate}
          weekStartsOn={1}
          onSelectDate={(date) => update({ workDate: date })}
          testID="work-when-calendar"
        />

        <View style={styles.selectedRow}>
          <AppText variant="technical" style={styles.selectedLabel}>
            {t('firstWork.when.selected')}
          </AppText>
          <AppText style={[type.heading1, styles.selectedValue]}>
            {workDate === null ? '—' : SELECTED_LABEL.format(localDateToDate(workDate))}
          </AppText>
        </View>
        <View style={styles.divider} />

        {needsSchedule || showSchedule ? (
          <ScheduleFields
            startTime={startTime}
            durationMinutes={durationMinutes}
            onChange={update}
          />
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('firstWork.when.addSchedule')}
            onPress={() => setShowSchedule(true)}
            testID="work-when-add-schedule"
            style={({ pressed }) => [styles.addSchedule, pressed && styles.pressed]}
          >
            <AppText style={[type.heading1, styles.addScheduleLabel]}>
              {t('firstWork.when.addSchedule')}
            </AppText>
          </Pressable>
        )}

        {end && (
          <AppText style={styles.note}>
            {t(end.nextDay ? 'firstWork.when.endsNextDay' : 'firstWork.when.endsAt', {
              time: end.time,
            })}
          </AppText>
        )}
        {touched && missingDate && (
          <AppText style={styles.error}>{t('firstWork.when.dateRequired')}</AppText>
        )}
        {touched && !missingDate && missingSchedule && (
          <AppText style={styles.error}>{t('firstWork.when.scheduleRequired')}</AppText>
        )}
      </View>

      <View style={styles.footer}>
        <OnboardingCta onPress={submit} testID="work-when-cta" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  heading: { marginTop: 28, marginHorizontal: 32, gap: 10 },
  title: {
    fontSize: 28,
    lineHeight: 31,
    letterSpacing: m.titleTracking,
    color: colors.textPrimary,
  },
  body: { flex: 1, marginTop: 18, marginHorizontal: 32, gap: 10 },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthLabel: { fontSize: 16, lineHeight: 20, letterSpacing: 0, color: colors.textPrimary },
  monthControls: { flexDirection: 'row', gap: 4 },
  monthButton: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  selectedRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectedLabel: { fontSize: 10, lineHeight: 14, letterSpacing: 1.8, color: palette.sage },
  selectedValue: { fontSize: 15, lineHeight: 19, letterSpacing: 0, color: colors.textPrimary },
  divider: { height: 1, backgroundColor: 'rgba(16,22,15,0.12)' },
  addSchedule: { minHeight: 44, justifyContent: 'center' },
  addScheduleLabel: { fontSize: 15, lineHeight: 19, letterSpacing: 0, color: colors.textPrimary },
  note: { fontSize: 12, lineHeight: 18, color: palette.sage },
  error: { fontSize: 13, lineHeight: 18, color: colors.errorFill },
  pressed: { opacity: 0.72 },
  footer: { paddingHorizontal: 32, paddingTop: 12 },
});
