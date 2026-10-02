import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard, Platform, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { BottomSheet } from '@/components/BottomSheet';
import { KeyboardScreen } from '@/components/KeyboardScreen';
import { MoneyInput } from '@/components/MoneyInput';
import { MutationError } from '@/components/TechnicalStates';
import { useKeyboardVisible } from '@/components/useKeyboardVisible';
import { formatDayMonth, type LocalDate } from '@/domain/calendar';
import { parseBRLToCents } from '@/domain/money';
import { OnboardingCta } from '@/features/onboarding/OnboardingCta';
import { FIELD_HELPER_SPACE } from '@/features/onboarding/OnboardingField';
import { OnboardingHeader } from '@/features/onboarding/OnboardingHeader';
import { deviceTimezone } from '@/features/onboarding/profile-data';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { colors, onboardingProfileMetrics as m, palette } from '@/theme/tokens';
import { ReceivedChoice } from '../form/ReceivedChoice';
import { useSaveFirstWork } from '../use-save-first-work';
import { WorkTypeChip } from '../WorkTypeChip';
import { useWorkDraft } from '../work-draft';
import {
  addDaysToLocalDate,
  dateToLocalDate,
  formatExpectedDate,
  localDateToDate,
  PAYMENT_TERMS,
  todayInTimezone,
} from '../work-schedule';

/**
 * Tela 22: valor e previsão de entrada. A previsão sempre termina num estado conhecido.
 * Com o teclado aberto só o valor (centralizado) e o botão aparecem; a previsão volta assim que
 * o teclado desce. Cada prazo mostra a data calculada; data de hoje ou passada pergunta se o
 * valor já foi recebido (7.7).
 */
export function WorkAmountScreen() {
  const { t } = useTranslation('onboarding');
  const type = useBrandTypography();
  const insets = useContext(SafeAreaInsetsContext) ?? { top: 0, bottom: 0 };
  const { type: workType, workDate, amount, expected, update } = useWorkDraft();
  const [touched, setTouched] = useState(false);
  const [pickingDate, setPickingDate] = useState(false);
  const [pendingDate, setPendingDate] = useState<LocalDate | null>(null);
  const [today] = useState(() => todayInTimezone(deviceTimezone()));
  const keyboardVisible = useKeyboardVisible();
  const save = useSaveFirstWork();

  const cents = parseBRLToCents(amount);
  const missingAmount = cents === null;
  const missingExpected = expected === null;
  const termDates = PAYMENT_TERMS.map((days) =>
    workDate === null ? null : addDaysToLocalDate(workDate, days),
  );
  const customDate =
    expected?.kind === 'date' && !termDates.includes(expected.date) ? expected.date : null;
  const expectedPast = expected?.kind === 'date' && expected.date <= today;
  // Digitando e ainda sem previsão: o botão só baixa o teclado para revelar as opções.
  const ctaDismissesKeyboard = keyboardVisible && expected === null;

  function chooseDate(date: LocalDate) {
    // Trocar a data desfaz o "Já recebi": a resposta valia para a data anterior.
    update({ expected: { kind: 'date', date } });
  }

  function chooseTerm(days: number) {
    if (workDate === null) return;
    Keyboard.dismiss();
    chooseDate(addDaysToLocalDate(workDate, days));
  }

  function openDatePicker() {
    if (workDate === null) return;
    Keyboard.dismiss();
    setPendingDate(
      expected?.kind === 'date' ? expected.date : addDaysToLocalDate(workDate, PAYMENT_TERMS[0]),
    );
    setPickingDate(true);
  }

  function confirmDate(date: LocalDate | null) {
    setPickingDate(false);
    if (date !== null) chooseDate(date);
  }

  function submit() {
    Keyboard.dismiss();
    setTouched(true);
    if (cents === null || expected === null) return;
    save.mutate(undefined, {
      // `replace`: a tela de valor sai da pilha, então não há como voltar e gravar de novo.
      onSuccess: ({ workId }) =>
        router.replace({ pathname: '/first-work-done', params: { workId } }),
    });
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]} testID="first-work-amount">
      <StatusBar style="dark" />
      <OnboardingHeader step={8} onBack={() => router.back()} testID="work-amount-header" />

      <KeyboardScreen
        bottomInset={Math.max(insets.bottom, 24) + 20}
        extraOffset={FIELD_HELPER_SPACE}
        footer={
          <View style={styles.footer}>
            <OnboardingCta
              label={t(
                ctaDismissesKeyboard
                  ? 'firstWork.amount.continueTyping'
                  : 'firstWork.amount.submit',
              )}
              loading={save.isPending}
              onPress={ctaDismissesKeyboard ? Keyboard.dismiss : submit}
              testID="work-amount-cta"
            />
          </View>
        }
      >
        <View style={styles.heading}>
          {workType && <WorkTypeChip type={workType} />}
          <AppText accessibilityRole="header" style={[type.heading1, styles.title]}>
            {t('firstWork.amount.title')}
          </AppText>
        </View>

        <View style={styles.content}>
          <MoneyInput
            align="center"
            variant="work"
            label={t('firstWork.amount.label')}
            error={touched && missingAmount ? t('firstWork.amount.required') : undefined}
            value={amount}
            onChangeText={(value) => update({ amount: value })}
            testID="work-amount-input"
          />

          {!keyboardVisible && (
            <View style={styles.expected} testID="work-expected">
              <AppText style={[type.heading1, styles.question]}>
                {t('firstWork.amount.expectedTitle')}
              </AppText>

              {expected?.kind === 'date' && (
                <View style={styles.expectedCard} testID="work-expected-card">
                  <View style={styles.expectedIdentity}>
                    <AppText variant="technical" style={styles.expectedLabel}>
                      {t('firstWork.amount.expectedLabel')}
                    </AppText>
                    <AppText style={[type.heading1, styles.expectedValue]}>
                      {formatExpectedDate(expected.date)}
                      {expectedPast ? (
                        <AppText style={styles.expectedPast}>
                          {`  ·  ${t('firstWork.amount.past')}`}
                        </AppText>
                      ) : null}
                    </AppText>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('firstWork.amount.change')}
                    onPress={() =>
                      customDate === null ? update({ expected: null }) : openDatePicker()
                    }
                    testID="work-expected-change"
                    style={({ pressed }) => [styles.change, pressed && styles.pressed]}
                  >
                    <AppText variant="technical" style={styles.changeLabel}>
                      {t('firstWork.amount.change')}
                    </AppText>
                  </Pressable>
                </View>
              )}

              {expected?.kind === 'date' && expectedPast && (
                <ReceivedChoice
                  date={expected.date}
                  received={expected.received === true}
                  onChange={(received) =>
                    update({ expected: { kind: 'date', date: expected.date, received } })
                  }
                />
              )}

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
                      onPress={() => chooseTerm(days)}
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
                onPress={() => {
                  Keyboard.dismiss();
                  update({ expected: { kind: 'unknown' } });
                }}
                testID="work-expected-unknown"
                style={({ pressed }) => [
                  styles.unknown,
                  expected?.kind === 'unknown' && styles.unknownOn,
                  pressed && styles.pressed,
                ]}
              >
                <AppText style={styles.unknownLabel}>{t('firstWork.amount.unknown')}</AppText>
                <View
                  style={
                    expected?.kind === 'unknown' ? styles.unknownRadioOn : styles.unknownRadioOff
                  }
                />
              </Pressable>

              {touched && missingExpected && (
                <AppText style={styles.error}>{t('firstWork.amount.expectedRequired')}</AppText>
              )}
              {expected?.kind === 'unknown' && (
                <AppText style={styles.note}>{t('firstWork.amount.unknownNote')}</AppText>
              )}
              {save.isError && <MutationError onRetry={submit} retrying={save.isPending} />}
            </View>
          )}
        </View>
      </KeyboardScreen>

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
  content: { marginTop: 24, marginHorizontal: 32, paddingBottom: 12, gap: 24 },
  expected: { gap: 10 },
  question: { fontSize: 17, lineHeight: 22, letterSpacing: -0.17, color: colors.textPrimary },
  expectedCard: {
    minHeight: 60,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.foreground,
    backgroundColor: colors.foreground,
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  expectedIdentity: { gap: 2 },
  expectedLabel: { fontSize: 9, lineHeight: 12, letterSpacing: 1.26, color: palette.sage },
  expectedValue: { fontSize: 18, lineHeight: 22, letterSpacing: 0, color: palette.cream },
  expectedPast: { fontSize: 12, lineHeight: 22, color: palette.secondaryText },
  change: { minHeight: 44, justifyContent: 'center' },
  changeLabel: { fontSize: 10, lineHeight: 14, letterSpacing: 1.4, color: palette.bronze },
  sheetTitle: { fontSize: 20, lineHeight: 24, letterSpacing: -0.4, color: colors.textPrimary },
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
    minHeight: 56,
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
  note: { fontSize: 12, lineHeight: 18, color: palette.sage },
  error: { fontSize: 13, lineHeight: 18, color: colors.errorFill },
  pressed: { opacity: 0.72 },
  footer: { marginHorizontal: 32 },
});
