import { useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { KeyboardScreen } from '@/components/KeyboardScreen';
import { MoneyInput } from '@/components/MoneyInput';
import { NavigationControl } from '@/components/NavigationControl';
import { PremiumBadge } from '@/components/PremiumBadge';
import { MutationError } from '@/components/TechnicalStates';
import { formatDayMonth } from '@/domain/calendar';
import { parseBRLToCents } from '@/domain/money';
import { requiresSchedule } from '@/domain/work-type';
import { usePremium } from '@/features/billing/entitlement';
import { nextAutomaticColorToken } from '@/features/locations/location-colors';
import { useWorkLocations } from '@/features/locations/locations-data';
import { deviceTimezone } from '@/features/onboarding/profile-data';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { motionDuration } from '@/theme/motion';
import { colors, palette, type WorkLocationColorToken, workLocationColors } from '@/theme/tokens';
import { useReducedMotion } from '@/theme/useReducedMotion';
import { receivedOn, useSaveWork } from '../use-save-work';
import { useNewWorkDraft, type WorkDraft, type WorkDraftStore } from '../work-draft';
import { addDaysToLocalDate, todayInTimezone, workEndDescription } from '../work-schedule';
import { FieldBox, OptionRow, RepeatIcon } from './FormPieces';
import { findLocationByName, LocationField } from './LocationField';
import { expectedChoice, PaymentSheet } from './PaymentSheet';
import { ColorSheet, RepeatSheet } from './PremiumSheets';
import { SaveWorkButton } from './SaveWorkButton';
import { DurationSheet, QUICK_DURATION_HOURS, StartTimeSheet } from './ScheduleSheets';
import { WorkDateSheet } from './WorkDateSheet';

export type WorkFormSheet = 'date' | 'start' | 'duration' | 'payment' | 'repeat' | 'color' | null;
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

type DatedFields = Pick<WorkDraft, 'workDate' | 'expected' | 'plannedTermDays'>;

/**
 * Nova data do Trabalho. O prazo D30/60/90 acompanha a data (inclusive o trazido de um
 * template ou das preferências); data específica e "não sei" ficam como estão.
 */
export function workDatePatch(draft: DatedFields, workDate: string): DatedFields {
  const choice = draft.workDate === null ? null : expectedChoice(draft.expected, draft.workDate);
  const termDays =
    choice?.kind === 'term' ? choice.days : draft.expected === null ? draft.plannedTermDays : null;
  return {
    workDate,
    expected:
      termDays !== null
        ? { kind: 'date', date: addDaysToLocalDate(workDate, termDays) }
        : draft.expected,
    plannedTermDays: null,
  };
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
  /** Chamado depois da animação de sucesso, com a data do Trabalho salvo. */
  onSaved: (workDate: string) => void;
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
  // Gravado: o botão mostra o check e a tela segue sozinha, sem outro toque.
  const [saved, setSaved] = useState(false);
  const reduced = useReducedMotion();
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (leaveTimer.current) clearTimeout(leaveTimer.current);
    },
    [],
  );
  const [today] = useState(() => todayInTimezone(deviceTimezone()));
  const premium = usePremium();
  const isPremium = premium.data === true;
  const locations = useWorkLocations();
  const knownLocations = locations.data ?? [];

  const workType = draft.type;
  const scheduleRequired = workType !== null && requiresSchedule(workType);
  const hours = draft.durationMinutes === null ? null : Math.round(draft.durationMinutes / 60);
  const isQuick = hours !== null && (QUICK_DURATION_HOURS as readonly number[]).includes(hours);
  const end = workEndDescription(draft.workDate, draft.startTime, draft.durationMinutes);
  const ready = canSaveWork(draft);

  // Cor que o Local terá: a escolhida agora, a já salva ou a automática de um Local novo.
  const match = findLocationByName(knownLocations, draft.locationName);
  const savedToken = match?.colorToken ?? null;
  const locationToken: WorkLocationColorToken =
    draft.colorToken ??
    (savedToken && savedToken in workLocationColors
      ? (savedToken as WorkLocationColorToken)
      : nextAutomaticColorToken(knownLocations.map((location) => location.colorToken)));
  const colorChosen = draft.colorToken !== null || (match && match.colorSource !== 'automatic');
  // Premium desbloqueado não mostra selo nem cadeado; enquanto o plano carrega, nenhum dos dois.
  const premiumAccessory = isPremium ? (
    <AppText style={styles.chevron}>{'›'}</AppText>
  ) : premium.isSuccess ? (
    <PremiumBadge size="short" />
  ) : null;

  function openSheet(next: Sheet) {
    Keyboard.dismiss();
    setSheet(next);
  }

  function expectedLabel(): string | null {
    const { expected, workDate } = draft;
    if (workDate === null || expected === null) return null;
    if (expected.kind === 'unknown') return t('form.expectedUnknown');
    if (receivedOn(expected) !== null) {
      return t('form.expectedReceived', { date: formatDayMonth(expected.date) });
    }
    const choice = expectedChoice(expected, workDate);
    return choice?.kind === 'term'
      ? t('form.expectedTerm', { days: choice.days, date: formatDayMonth(expected.date) })
      : formatDayMonth(expected.date, { year: true });
  }

  function submit() {
    Keyboard.dismiss();
    if (!ready || saved) return;
    const workDate = draft.workDate;
    save.mutate(undefined, {
      onSuccess: () => {
        setSaved(true);
        const hold =
          motionDuration('saveMorph', reduced) +
          motionDuration('saveCheck', reduced) +
          motionDuration('saveHold', reduced);
        // "Reduzir movimento": sem espera, segue na hora.
        if (hold === 0) onSaved(workDate ?? today);
        else leaveTimer.current = setTimeout(() => onSaved(workDate ?? today), hold);
      },
    });
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]} testID="work-form">
      <View style={styles.header}>
        <NavigationControl kind="back" onPress={onBack} />
        <AppText accessibilityRole="header" style={[type.heading1, styles.title]}>
          {editing ? t('form.editTitle') : t('form.title')}
        </AppText>
      </View>

      {/* O campo em foco (local, valor) sempre fica acima do teclado e do botão. */}
      <KeyboardScreen
        bottomInset={Math.max(insets.bottom, 16) + 8}
        contentContainerStyle={styles.content}
        footer={
          <View style={styles.footer}>
            <SaveWorkButton
              label={editing ? t('form.saveChanges') : t('form.save')}
              savingLabel={t('form.saving')}
              savedLabel={editing ? t('form.savedChanges') : t('form.saved')}
              phase={saved ? 'saved' : save.isPending ? 'saving' : 'idle'}
              disabled={!ready}
              onPress={submit}
              testID="work-save"
            />
          </View>
        }
      >
        <LocationField
          value={draft.locationName}
          colorToken={draft.colorToken}
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
                {hours !== null && !isQuick ? t('form.hours', { hours }) : t('form.durationOther')}
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

        <View style={styles.divider} />
        {!editing && (
          <OptionRow
            icon={<RepeatIcon />}
            label={t('form.repeat')}
            value={t(`form.repeatLabel.${draft.repeat}`)}
            accessory={premiumAccessory}
            onPress={() => openSheet('repeat')}
            testID="work-repeat-field"
          />
        )}
        <OptionRow
          icon={
            <View
              style={[styles.colorDot, { backgroundColor: workLocationColors[locationToken] }]}
            />
          }
          label={t('form.color')}
          value={colorChosen ? t(`form.colors.${locationToken}`) : t('form.colorAutomatic')}
          accessory={premiumAccessory}
          onPress={() => openSheet('color')}
          testID="work-color-field"
        />

        {save.isError && <MutationError onRetry={submit} retrying={save.isPending} />}
      </KeyboardScreen>

      <WorkDateSheet
        open={sheet === 'date'}
        value={draft.workDate}
        today={today}
        onClose={() => setSheet(null)}
        onConfirm={(workDate) => {
          draft.update(workDatePatch(draft, workDate));
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
      <RepeatSheet
        open={sheet === 'repeat'}
        isPremium={isPremium}
        start={draft.workDate ?? today}
        value={draft.repeat}
        onClose={() => setSheet(null)}
        onConfirm={(repeat) => {
          draft.update({ repeat });
          setSheet(null);
        }}
      />
      <ColorSheet
        open={sheet === 'color'}
        isPremium={isPremium}
        locationName={draft.locationName}
        value={locationToken}
        previewDate={draft.workDate ?? today}
        locations={knownLocations}
        onClose={() => setSheet(null)}
        onConfirm={(colorToken) => {
          draft.update({ colorToken });
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
  divider: { height: 1, backgroundColor: 'rgba(16,22,15,0.1)', marginVertical: 8 },
  colorDot: { width: 18, height: 18, borderRadius: 9 },
  footer: { paddingHorizontal: 24 },
  pressed: { opacity: 0.72 },
});
