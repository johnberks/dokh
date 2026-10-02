import DateTimePicker from '@react-native-community/datetimepicker';
import { type ReactNode, useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard, Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { BottomSheet } from '@/components/BottomSheet';
import { CalendarGrid } from '@/components/CalendarGrid';
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/icons/heroicons';
import { KeyboardScreen } from '@/components/KeyboardScreen';
import { MoneyInput } from '@/components/MoneyInput';
import { MutationError } from '@/components/TechnicalStates';
import { WorkTypeSelector } from '@/components/WorkTypeSelector';
import { formatDayMonth, type LocalDate, monthOf, shiftMonth } from '@/domain/calendar';
import { parseBRLToCents } from '@/domain/money';
import { requiresSchedule } from '@/domain/work-type';
import { OnboardingCta } from '@/features/onboarding/OnboardingCta';
import { FIELD_HELPER_SPACE, OnboardingField } from '@/features/onboarding/OnboardingField';
import { useProfileDraft } from '@/features/onboarding/profile-draft';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { colors, motion, palette } from '@/theme/tokens';
import { useReducedMotion } from '@/theme/useReducedMotion';
import { ReceivedChoice } from '../form/ReceivedChoice';
import { ScheduleFields } from '../ScheduleFields';
import { useWorkDraft } from '../work-draft';
import {
  addDaysToLocalDate,
  dateToLocalDate,
  localDateToDate,
  PAYMENT_TERMS,
  workEndDescription,
} from '../work-schedule';

const MONTH_LABEL = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' });

type StepProps = { onNext: () => void; today: LocalDate };

/** Moldura comum das etapas: título, conteúdo que rola com o teclado e botão fixo. */
function StepFrame({
  title,
  description,
  cta,
  extraOffset,
  children,
  testID,
}: {
  title: string;
  description?: string;
  cta: ReactNode;
  extraOffset?: number;
  children: ReactNode;
  testID: string;
}) {
  const type = useBrandTypography();
  const insets = useContext(SafeAreaInsetsContext) ?? { top: 0, bottom: 0 };
  return (
    <KeyboardScreen
      bottomInset={Math.max(insets.bottom, 24) + 20}
      extraOffset={extraOffset}
      footer={<View style={styles.footer}>{cta}</View>}
      testID={testID}
    >
      <View style={styles.heading}>
        <AppText accessibilityRole="header" style={[type.heading1, styles.title]}>
          {title}
        </AppText>
        {description ? <AppText style={styles.description}>{description}</AppText> : null}
      </View>
      <View style={styles.body}>{children}</View>
    </KeyboardScreen>
  );
}

/** Etapa 1: tipo do trabalho. Residência não aparece aqui: é gerenciada no Perfil. */
export function TypeStep({ onNext }: StepProps) {
  const { t } = useTranslation('onboarding');
  const isResident = useProfileDraft((state) => state.status === 'resident');
  const { type: selected, update } = useWorkDraft();
  const [touched, setTouched] = useState(false);
  return (
    <StepFrame
      title={t('firstWork.type.title')}
      description={t('firstWork.type.description')}
      testID="first-work-type"
      cta={
        <OnboardingCta
          onPress={() => {
            setTouched(true);
            if (selected !== null) onNext();
          }}
          testID="work-type-cta"
        />
      }
    >
      <WorkTypeSelector
        variant="choice"
        label={t('firstWork.type.title')}
        value={selected}
        onChange={(value) => update({ type: value })}
        testID="work-type"
      />
      {isResident && <AppText style={styles.note}>{t('firstWork.type.residencyNote')}</AppText>}
      {touched && selected === null && (
        <AppText style={styles.error}>{t('firstWork.type.required')}</AppText>
      )}
    </StepFrame>
  );
}

/** Etapa 2: só o nome do lugar, centralizado; a peça ganha o local enquanto se digita. */
export function PlaceStep({ onNext }: StepProps) {
  const { t } = useTranslation('onboarding');
  const { type: workType, locationName, update } = useWorkDraft();
  const [touched, setTouched] = useState(false);
  const trimmed = locationName.trim();
  const showError = touched && trimmed.length === 0;

  function submit() {
    setTouched(true);
    if (trimmed.length === 0) return;
    update({ locationName: trimmed });
    onNext();
  }

  return (
    <StepFrame
      title={t(
        workType === 'procedure'
          ? 'firstWork.place.titleProcedure'
          : workType === 'appointment'
            ? 'firstWork.place.titleAppointment'
            : 'firstWork.place.titleShift',
      )}
      extraOffset={FIELD_HELPER_SPACE}
      testID="first-work-place"
      cta={<OnboardingCta onPress={submit} testID="work-place-cta" />}
    >
      <OnboardingField
        autoCapitalize="words"
        autoCorrect={false}
        autoFocus
        error={showError}
        helper={showError ? t('firstWork.place.required') : t('firstWork.place.hint')}
        label={t('firstWork.place.label')}
        onChangeText={(value) => update({ locationName: value })}
        onSubmitEditing={submit}
        returnKeyType="next"
        submitBehavior="submit"
        testID="work-place-input"
        value={locationName}
      />
    </StepFrame>
  );
}

/**
 * Etapa 3: "Data do trabalho" — futuro ou passado, dias passados com a mesma aparência (7.7).
 * Data obrigatória; horário e duração só são exigidos em Plantão.
 */
export function WhenStep({ onNext, today }: StepProps) {
  const { t } = useTranslation('onboarding');
  const type = useBrandTypography();
  const { type: workType, workDate, startTime, durationMinutes, update } = useWorkDraft();
  const [month, setMonth] = useState(() => monthOf(workDate ?? today));
  const [showSchedule, setShowSchedule] = useState(startTime !== null);
  const [touched, setTouched] = useState(false);

  const needsSchedule = workType !== null && requiresSchedule(workType);
  const missingDate = workDate === null;
  const missingSchedule = needsSchedule && (startTime === null || durationMinutes === null);
  const end = workEndDescription(workDate, startTime, durationMinutes);

  return (
    <StepFrame
      title={t('firstWork.when.title')}
      testID="first-work-when"
      cta={
        <OnboardingCta
          onPress={() => {
            setTouched(true);
            if (!missingDate && !missingSchedule) onNext();
          }}
          testID="work-when-cta"
        />
      }
    >
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
            <ChevronLeftIcon color={palette.sage} size={18} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('profile.continue')}
            onPress={() => setMonth(shiftMonth(month, 1))}
            testID="work-when-next-month"
            style={({ pressed }) => [styles.monthButton, pressed && styles.pressed]}
          >
            <ChevronRightIcon color={palette.sage} size={18} />
          </Pressable>
        </View>
      </View>

      <CalendarGrid
        dimPast={false}
        density="compact"
        month={month}
        today={today}
        selected={workDate}
        weekStartsOn={1}
        onSelectDate={(date) => update({ workDate: date })}
        testID="work-when-calendar"
      />
      <View style={styles.divider} />

      {needsSchedule || showSchedule ? (
        <ScheduleFields startTime={startTime} durationMinutes={durationMinutes} onChange={update} />
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
    </StepFrame>
  );
}

/** Etapa 4: só o valor, centralizado; a peça mostra o valor enquanto se digita. */
export function AmountStep({ onNext }: StepProps) {
  const { t } = useTranslation('onboarding');
  const { amount, update } = useWorkDraft();
  const [touched, setTouched] = useState(false);
  const missingAmount = parseBRLToCents(amount) === null;

  return (
    <StepFrame
      title={t('firstWork.amount.title')}
      extraOffset={FIELD_HELPER_SPACE}
      testID="first-work-amount"
      cta={
        <OnboardingCta
          label={t('firstWork.link.continue')}
          onPress={() => {
            Keyboard.dismiss();
            setTouched(true);
            if (!missingAmount) onNext();
          }}
          testID="work-amount-cta"
        />
      }
    >
      <MoneyInput
        align="center"
        variant="work"
        label={t('firstWork.amount.label')}
        error={touched && missingAmount ? t('firstWork.amount.required') : undefined}
        value={amount}
        onChangeText={(value) => update({ amount: value })}
        testID="work-amount-input"
      />
    </StepFrame>
  );
}

/**
 * Etapa 5: quando o valor deve entrar. Cada prazo mostra a data calculada a partir do trabalho;
 * a ligação `12 OUT → +30 dias → 11 NOV` mostra o trabalho virando dinheiro. Data de hoje ou
 * passada pergunta se já recebeu (7.7). "Ainda não sei" é um estado válido.
 */
export function ExpectedStep({
  today,
  onSave,
  saving,
  saveFailed,
}: {
  today: LocalDate;
  onSave: () => void;
  saving: boolean;
  saveFailed: boolean;
}) {
  const { t } = useTranslation('onboarding');
  const type = useBrandTypography();
  const { workDate, expected, update } = useWorkDraft();
  const [touched, setTouched] = useState(false);
  const [pickingDate, setPickingDate] = useState(false);
  const [pendingDate, setPendingDate] = useState<LocalDate | null>(null);

  const termDates = PAYMENT_TERMS.map((days) =>
    workDate === null ? null : addDaysToLocalDate(workDate, days),
  );
  const customDate =
    expected?.kind === 'date' && !termDates.includes(expected.date) ? expected.date : null;
  const expectedPast = expected?.kind === 'date' && expected.date <= today;

  function chooseDate(date: LocalDate) {
    // Trocar a data desfaz o "Já recebi": a resposta valia para a data anterior.
    update({ expected: { kind: 'date', date } });
  }

  function openDatePicker() {
    if (workDate === null) return;
    setPendingDate(
      expected?.kind === 'date' ? expected.date : addDaysToLocalDate(workDate, PAYMENT_TERMS[0]),
    );
    setPickingDate(true);
  }

  function confirmDate(date: LocalDate | null) {
    setPickingDate(false);
    if (date !== null) chooseDate(date);
  }

  return (
    <>
      <StepFrame
        title={t('firstWork.expected.title')}
        testID="first-work-expected"
        cta={
          <OnboardingCta
            label={t('firstWork.amount.submit')}
            loading={saving}
            onPress={() => {
              setTouched(true);
              if (expected !== null) onSave();
            }}
            testID="work-expected-cta"
          />
        }
      >
        {workDate !== null && <MoneyLink workDate={workDate} today={today} />}

        <View style={styles.terms}>
          {PAYMENT_TERMS.map((days, index) => {
            const date = termDates[index];
            const selected = expected?.kind === 'date' && expected.date === date;
            const dateLabel = date === null ? '' : formatDayMonth(date);
            return (
              <Pressable
                key={days}
                accessibilityRole="button"
                accessibilityLabel={`${t('firstWork.amount.inDays', { days })}, ${dateLabel}`}
                accessibilityState={{ selected }}
                onPress={() => date !== null && chooseDate(date)}
                testID={`work-expected-${days}`}
                style={({ pressed }) => [
                  styles.term,
                  selected ? styles.termOn : styles.termOff,
                  pressed && styles.pressed,
                ]}
              >
                <AppText style={selected ? styles.termOnText : styles.termOffText}>
                  {t('firstWork.amount.termDays', { days })}
                </AppText>
                <AppText
                  variant="technical"
                  style={[styles.termDate, selected && styles.termDateOn]}
                  testID={`work-expected-${days}-date`}
                >
                  {dateLabel}
                </AppText>
              </Pressable>
            );
          })}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('firstWork.amount.pickDate')}
            accessibilityState={{ selected: customDate !== null }}
            onPress={openDatePicker}
            testID="work-expected-other"
            style={({ pressed }) => [
              styles.term,
              customDate !== null ? styles.termOn : styles.termOff,
              pressed && styles.pressed,
            ]}
          >
            <AppText style={customDate !== null ? styles.termOnText : styles.termOffText}>
              {t('firstWork.amount.otherDate')}
            </AppText>
            {customDate !== null ? (
              <AppText variant="technical" style={[styles.termDate, styles.termDateOn]}>
                {formatDayMonth(customDate)}
              </AppText>
            ) : null}
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="radio"
          accessibilityLabel={t('firstWork.amount.unknown')}
          accessibilityState={{ checked: expected?.kind === 'unknown' }}
          onPress={() => update({ expected: { kind: 'unknown' } })}
          testID="work-expected-unknown"
          style={({ pressed }) => [
            styles.unknown,
            expected?.kind === 'unknown' && styles.unknownOn,
            pressed && styles.pressed,
          ]}
        >
          <AppText style={styles.unknownLabel}>{t('firstWork.amount.unknown')}</AppText>
          <View
            style={expected?.kind === 'unknown' ? styles.unknownRadioOn : styles.unknownRadioOff}
          />
        </Pressable>

        {expected?.kind === 'date' && expectedPast && (
          <ReceivedChoice
            date={expected.date}
            received={expected.received === true}
            onChange={(received) =>
              update({ expected: { kind: 'date', date: expected.date, received } })
            }
          />
        )}
        {expected?.kind === 'unknown' && (
          <AppText style={styles.note}>{t('firstWork.amount.unknownNote')}</AppText>
        )}
        {touched && expected === null && (
          <AppText style={styles.error}>{t('firstWork.amount.expectedRequired')}</AppText>
        )}
        {saveFailed && <MutationError onRetry={onSave} retrying={saving} />}
      </StepFrame>

      {Platform.OS === 'ios' ? (
        // Calendário da Apple numa folha; a escolha só vale ao confirmar.
        <BottomSheet
          open={pickingDate}
          onClose={() => setPickingDate(false)}
          accessibilityLabel={t('firstWork.amount.pickDate')}
          testID="work-expected-sheet"
        >
          <AppText style={[type.heading1, styles.sheetTitle]}>
            {t('firstWork.amount.dateSheetTitle')}
          </AppText>
          {pendingDate !== null && workDate !== null && (
            <DateTimePicker
              accessibilityLabel={t('firstWork.amount.pickDate')}
              accentColor={palette.bronze}
              display="inline"
              locale="pt-BR"
              minimumDate={localDateToDate(workDate)}
              mode="date"
              onValueChange={(_event, date) => {
                if (date) setPendingDate(dateToLocalDate(date));
              }}
              testID="work-expected-picker"
              themeVariant="light"
              value={localDateToDate(pendingDate)}
            />
          )}
          <OnboardingCta
            label={t('firstWork.amount.confirmDate')}
            onPress={() => confirmDate(pendingDate)}
            testID="work-expected-confirm"
          />
        </BottomSheet>
      ) : (
        // Android abre o próprio diálogo do sistema.
        pickingDate &&
        pendingDate !== null &&
        workDate !== null && (
          <DateTimePicker
            minimumDate={localDateToDate(workDate)}
            mode="date"
            onDismiss={() => setPickingDate(false)}
            onValueChange={(_event, date) => confirmDate(date ? dateToLocalDate(date) : null)}
            testID="work-expected-picker"
            value={localDateToDate(pendingDate)}
          />
        )
      )}
    </>
  );
}

function daysBetween(from: LocalDate, to: LocalDate): number {
  return Math.round((localDateToDate(to).getTime() - localDateToDate(from).getTime()) / 86_400_000);
}

/**
 * Trabalho → dinheiro: a data do trabalho, o prazo e a data em que o valor entra. Muda na hora a
 * cada escolha — é o conceito central da DOKH dito sem texto.
 */
function MoneyLink({ workDate, today }: { workDate: LocalDate; today: LocalDate }) {
  const { t } = useTranslation('onboarding');
  const type = useBrandTypography();
  const reduced = useReducedMotion();
  const expected = useWorkDraft((state) => state.expected);
  const enter = reduced ? undefined : FadeIn.duration(motion.enter);

  const middle =
    expected?.kind === 'date'
      ? t('firstWork.link.days', { days: daysBetween(workDate, expected.date) })
      : expected?.kind === 'unknown'
        ? '—'
        : '?';
  const end =
    expected?.kind === 'date'
      ? {
          date: formatDayMonth(expected.date),
          caption:
            expected.date > today
              ? t('firstWork.link.entry')
              : expected.received
                ? t('firstWork.link.received')
                : t('firstWork.link.past'),
        }
      : expected?.kind === 'unknown'
        ? { date: '—', caption: t('firstWork.link.undated') }
        : null;
  const linked = expected !== null;

  return (
    <View
      accessible
      accessibilityLabel={[
        formatDayMonth(workDate),
        t('firstWork.link.work'),
        middle,
        end ? `${end.date}, ${end.caption}` : '',
      ].join(', ')}
      style={styles.link}
      testID="work-money-link"
    >
      <View style={styles.linkNode}>
        <AppText style={[type.heading1, styles.linkDate]}>{formatDayMonth(workDate)}</AppText>
        <AppText variant="technical" style={styles.linkCaption}>
          {t('firstWork.link.work')}
        </AppText>
      </View>
      <View style={[styles.linkLine, linked && styles.linkLineOn]} />
      <Animated.View
        key={`m-${middle}`}
        entering={enter}
        style={[styles.linkTerm, linked && styles.linkTermOn]}
      >
        <AppText style={[type.heading1, styles.linkTermText]} testID="work-money-link-term">
          {middle}
        </AppText>
      </Animated.View>
      <View style={[styles.linkLine, linked && styles.linkLineOn]} />
      <Animated.View
        key={`e-${end?.date ?? 'none'}-${end?.caption ?? ''}`}
        entering={enter}
        style={[styles.linkNode, !end && styles.linkNodeEmpty]}
      >
        <AppText style={[type.heading1, styles.linkDate]} testID="work-money-link-entry">
          {end?.date ?? ' '}
        </AppText>
        <AppText variant="technical" style={styles.linkCaption}>
          {end?.caption ?? t('firstWork.link.entry')}
        </AppText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: { marginTop: 22, marginHorizontal: 32, gap: 8 },
  title: { fontSize: 24, lineHeight: 28, letterSpacing: -0.6, color: colors.textPrimary },
  description: { fontSize: 14, lineHeight: 21, color: colors.textMuted },
  body: { marginTop: 18, marginHorizontal: 32, paddingBottom: 12, gap: 12 },
  footer: { paddingHorizontal: 32 },
  note: { fontSize: 12, lineHeight: 18, color: palette.sage },
  error: { fontSize: 13, lineHeight: 18, color: colors.errorFill },
  pressed: { opacity: 0.72 },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthLabel: { fontSize: 16, lineHeight: 20, letterSpacing: 0, color: colors.textPrimary },
  monthControls: { flexDirection: 'row', gap: 4 },
  monthButton: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  divider: { height: 1, backgroundColor: 'rgba(16,22,15,0.12)' },
  addSchedule: { minHeight: 44, justifyContent: 'center' },
  addScheduleLabel: { fontSize: 15, lineHeight: 19, letterSpacing: 0, color: colors.textPrimary },
  terms: { flexDirection: 'row', gap: 6 },
  term: {
    flex: 1,
    minHeight: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  termOn: { borderWidth: 1, borderColor: colors.foreground, backgroundColor: colors.foreground },
  termOff: { borderWidth: 1, borderColor: 'rgba(16,22,15,0.18)' },
  termOnText: { fontSize: 13, lineHeight: 17, color: palette.cream },
  termOffText: { fontSize: 13, lineHeight: 17, color: colors.textPrimary },
  termDate: { fontSize: 10, lineHeight: 13, letterSpacing: 1.2, color: palette.sage },
  termDateOn: { color: palette.bronze },
  unknown: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(16,22,15,0.3)',
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  unknownOn: { borderStyle: 'solid', borderColor: colors.foreground },
  unknownLabel: { fontSize: 15, lineHeight: 19, color: colors.textMuted },
  unknownRadioOn: { width: 20, height: 20, borderRadius: 10, backgroundColor: palette.bronze },
  unknownRadioOff: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(16,22,15,0.25)',
  },
  sheetTitle: { fontSize: 20, lineHeight: 24, letterSpacing: -0.4, color: colors.textPrimary },
  link: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  linkNode: { alignItems: 'center', minWidth: 64, gap: 2 },
  linkNodeEmpty: { opacity: 0.5 },
  linkDate: { fontSize: 15, lineHeight: 19, letterSpacing: 0, color: colors.textPrimary },
  linkCaption: { fontSize: 9, lineHeight: 12, letterSpacing: 1.2, color: palette.sage },
  linkLine: { flex: 1, height: 2, borderRadius: 1, backgroundColor: 'rgba(16,22,15,0.14)' },
  linkLineOn: { backgroundColor: palette.bronze },
  linkTerm: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(16,22,15,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  linkTermOn: { borderColor: palette.bronze, backgroundColor: palette.bronze },
  linkTermText: { fontSize: 12, lineHeight: 16, letterSpacing: 0, color: colors.textPrimary },
});
