import { useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { MoneyInput } from '@/components/MoneyInput';
import { NavigationControl } from '@/components/NavigationControl';
import { MutationError } from '@/components/TechnicalStates';
import { formatDayMonth } from '@/domain/calendar';
import { parseBRLToCents } from '@/domain/money';
import { requiresSchedule } from '@/domain/work-type';
import { KEYBOARD_CTA_GAP } from '@/features/onboarding/OnboardingCta';
import { deviceTimezone } from '@/features/onboarding/profile-data';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { colors, palette } from '@/theme/tokens';
import { useSaveWork } from '../use-save-work';
import { useNewWorkDraft, type WorkDraftStore } from '../work-draft';
import { addDaysToLocalDate, todayInTimezone, workEndDescription } from '../work-schedule';
import { DarkButton, FieldBox } from './FormPieces';
import { LocationField } from './LocationField';
import { expectedChoice, PaymentSheet } from './PaymentSheet';
import { DurationSheet, QUICK_DURATION_HOURS, StartTimeSheet } from './ScheduleSheets';
import { WorkDateSheet } from './WorkDateSheet';

export type WorkFormSheet = 'date' | 'start' | 'duration' | 'payment' | null;
type Sheet = WorkFormSheet;

/** Pode salvar? Local, data e valor sempre; início e duração só em Plantão (UX Agenda 07). */
export function canSaveWork(draft: {
  type: string | null;
  locationName: string;
  workDate: string | null;
  startTime: string | null;
  durationMinutes: number | null;
  amount: string;
}): boolean {
  if (draft.type === null || draft.workDate === null) return false;
  if (draft.locationName.trim() === '' || parseBRLToCents(draft.amount) === null) return false;
  if (requiresSchedule(draft.type as 'shift')) {
    return draft.startTime !== null && draft.durationMinutes !== null;
  }
  return true;
}

/**
 * Agenda 07: formulário de um Trabalho novo. Data, horário, duração "Outro" e previsão abrem
 * folhas (08–10); valor e local são digitados na própria tela, que rola como um todo e mantém
 * campo e botão acima do teclado.
 */
export function WorkForm({
  onBack,
  onSaved,
  initialSheet = null,
  store = useNewWorkDraft,
  workId,
}: {
  onBack: () => void;
  onSaved: () => void;
  /** Vindo de um template, o formulário já abre perguntando "quando será?". */
  initialSheet?: Sheet;
  /** Rascunho usado: o do `+` (padrão) ou o da edição. */
  store?: WorkDraftStore;
  /** Presente na edição (Agenda 16): grava por atualização e muda título e botão. */
  workId?: string;
}) {
  const { t } = useTranslation('agenda');
  const type = useBrandTypography();
  const insets = useContext(SafeAreaInsetsContext) ?? { top: 0, bottom: 0 };
  const draft = store();
  const save = useSaveWork(store, workId);
  const editing = workId !== undefined;
  const [sheet, setSheet] = useState<Sheet>(initialSheet);
  const [today] = useState(() => todayInTimezone(deviceTimezone()));

  const workType = draft.type;
  const scheduleRequired = workType !== null && requiresSchedule(workType);
  const hours = draft.durationMinutes === null ? null : Math.round(draft.durationMinutes / 60);
  const isQuick = hours !== null && (QUICK_DURATION_HOURS as readonly number[]).includes(hours);
  const end = workEndDescription(draft.workDate, draft.startTime, draft.durationMinutes);
  const ready = canSaveWork(draft);

  function openSheet(next: Sheet) {
    Keyboard.dismiss();
    setSheet(next);
  }

  function expectedLabel(): string | null {
    const { expected, workDate } = draft;
    if (workDate === null || expected === null) return null;
    if (expected.kind === 'unknown') return t('form.expectedUnknown');
    const choice = expectedChoice(expected, workDate);
    return choice?.kind === 'term'
      ? t('form.expectedTerm', { days: choice.days, date: formatDayMonth(expected.date) })
      : formatDayMonth(expected.date, { year: true });
  }

  function submit() {
    Keyboard.dismiss();
    if (!ready) return;
    save.mutate(undefined, { onSuccess: onSaved });
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]} testID="work-form">
      <View style={styles.header}>
        <NavigationControl kind="back" onPress={onBack} />
        <AppText accessibilityRole="header" style={[type.heading1, styles.title]}>
          {editing ? t('form.editTitle') : t('form.title')}
        </AppText>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={KEYBOARD_CTA_GAP}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <LocationField
            value={draft.locationName}
            onChange={(locationName) => draft.update({ locationName })}
          />

          <View style={styles.row}>
            <View style={styles.flex}>
              <FieldBox
                label={t('form.date')}
                value={
                  draft.workDate === null ? null : formatDayMonth(draft.workDate, { year: true })
                }
                placeholder={t('form.choose')}
                onPress={() => openSheet('date')}
                testID="work-date-field"
              />
            </View>
            <View style={styles.flex}>
              <FieldBox
                label={t('form.start')}
                value={draft.startTime}
                placeholder={scheduleRequired ? t('form.choose') : t('form.optional')}
                onPress={() => openSheet('start')}
                testID="work-start-field"
              />
            </View>
          </View>

          <View style={styles.durationBlock}>
            <AppText variant="technical" style={styles.sectionLabel}>
              {scheduleRequired ? t('form.duration') : t('form.durationOptional')}
            </AppText>
            <View accessibilityRole="radiogroup" style={styles.chips}>
              {QUICK_DURATION_HOURS.map((value) => (
                <Pressable
                  key={value}
                  accessibilityRole="radio"
                  accessibilityLabel={t('form.hours', { hours: value })}
                  accessibilityState={{ checked: hours === value }}
                  onPress={() => {
                    Keyboard.dismiss();
                    draft.update({ durationMinutes: hours === value ? null : value * 60 });
                  }}
                  testID={`work-duration-${value}`}
                  style={({ pressed }) => [
                    styles.chip,
                    hours === value ? styles.chipOn : styles.chipOff,
                    pressed && styles.pressed,
                  ]}
                >
                  <AppText
                    style={[type.heading1, styles.chipText, hours === value && styles.chipTextOn]}
                  >
                    {t('form.hours', { hours: value })}
                  </AppText>
                </Pressable>
              ))}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('form.durationOther')}
                accessibilityState={{ selected: hours !== null && !isQuick }}
                onPress={() => openSheet('duration')}
                testID="work-duration-other"
                style={({ pressed }) => [
                  styles.chip,
                  hours !== null && !isQuick ? styles.chipOn : styles.chipOff,
                  pressed && styles.pressed,
                ]}
              >
                <AppText
                  style={[
                    type.heading1,
                    styles.chipText,
                    hours !== null && !isQuick && styles.chipTextOn,
                  ]}
                >
                  {hours !== null && !isQuick
                    ? t('form.hours', { hours })
                    : t('form.durationOther')}
                </AppText>
              </Pressable>
            </View>
            {end && (
              <AppText style={styles.note} testID="work-form-end">
                {end.nextDay
                  ? t('form.endsAtDate', { time: end.time, date: formatDayMonth(end.date) })
                  : t('form.endsAt', { time: end.time })}
              </AppText>
            )}
          </View>

          <MoneyInput
            label={t('form.amount')}
            value={draft.amount}
            onChangeText={(amount) => draft.update({ amount })}
            testID="work-amount-input"
          />

          <FieldBox
            label={t('form.expected')}
            value={expectedLabel()}
            placeholder={draft.workDate === null ? t('form.expectedNeedsDate') : t('form.define')}
            disabled={draft.workDate === null}
            onPress={() => openSheet('payment')}
            accessory={<AppText style={styles.chevron}>{'›'}</AppText>}
            testID="work-expected-field"
          />

          {save.isError && <MutationError onRetry={submit} retrying={save.isPending} />}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
          <DarkButton
            label={editing ? t('form.saveChanges') : t('form.save')}
            disabled={!ready}
            loading={save.isPending}
            onPress={submit}
            testID="work-save"
          />
        </View>
      </KeyboardAvoidingView>

      <WorkDateSheet
        open={sheet === 'date'}
        value={draft.workDate}
        today={today}
        onClose={() => setSheet(null)}
        onConfirm={(workDate) => {
          // Prazo D30/60/90 acompanha a nova data (inclusive o trazido de um template);
          // data específica e "não sei" ficam como estão.
          const choice =
            draft.workDate === null ? null : expectedChoice(draft.expected, draft.workDate);
          const termDays =
            choice?.kind === 'term'
              ? choice.days
              : draft.expected === null
                ? draft.plannedTermDays
                : null;
          draft.update({
            workDate,
            expected:
              termDays !== null
                ? { kind: 'date', date: addDaysToLocalDate(workDate, termDays) }
                : draft.expected,
            plannedTermDays: null,
          });
          setSheet(null);
        }}
      />
      <StartTimeSheet
        open={sheet === 'start'}
        value={draft.startTime}
        optional={!scheduleRequired}
        onClose={() => setSheet(null)}
        onConfirm={(startTime) => {
          draft.update({ startTime });
          setSheet(null);
        }}
      />
      <DurationSheet
        open={sheet === 'duration'}
        valueMinutes={draft.durationMinutes}
        workDate={draft.workDate}
        startTime={draft.startTime}
        onClose={() => setSheet(null)}
        onConfirm={(durationMinutes) => {
          draft.update({ durationMinutes });
          setSheet(null);
        }}
      />
      {draft.workDate !== null && (
        <PaymentSheet
          open={sheet === 'payment'}
          workDate={draft.workDate}
          value={draft.expected}
          onClose={() => setSheet(null)}
          onConfirm={(expected) => {
            draft.update({ expected });
            setSheet(null);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: {
    paddingTop: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: { fontSize: 22, lineHeight: 26, letterSpacing: -0.44, color: colors.textPrimary },
  content: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16, gap: 10 },
  row: { flexDirection: 'row', gap: 10 },
  durationBlock: { gap: 10, paddingTop: 6, paddingBottom: 6 },
  sectionLabel: {
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 1.62,
    color: palette.sage,
    paddingLeft: 4,
  },
  chips: { flexDirection: 'row', gap: 8 },
  chip: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipOn: { borderColor: colors.foreground, backgroundColor: colors.foreground },
  chipOff: { borderColor: 'rgba(16,22,15,0.2)' },
  chipText: { fontSize: 15, lineHeight: 19, letterSpacing: 0, color: colors.textPrimary },
  chipTextOn: { color: palette.cream },
  note: { fontSize: 13, lineHeight: 18, color: palette.mutedCopy, paddingLeft: 4 },
  chevron: { fontSize: 18, lineHeight: 22, color: palette.sage },
  footer: { paddingHorizontal: 24, paddingTop: 12 },
  pressed: { opacity: 0.72 },
});
