import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { MoneyInput } from '@/components/MoneyInput';
import { MutationError } from '@/components/TechnicalStates';
import { parseBRLToCents } from '@/domain/money';
import { OnboardingCta } from '@/features/onboarding/OnboardingCta';
import { OnboardingHeader } from '@/features/onboarding/OnboardingHeader';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { colors, onboardingProfileMetrics as m, palette } from '@/theme/tokens';
import { useSaveFirstWork } from '../use-save-first-work';
import { WorkTypeChip } from '../WorkTypeChip';
import { useWorkDraft } from '../work-draft';
import { addDaysToLocalDate, formatExpectedDate, PAYMENT_TERMS } from '../work-schedule';

/** Tela 22: valor e previsão de entrada. A previsão sempre termina num estado conhecido. */
export function WorkAmountScreen() {
  const { t } = useTranslation('onboarding');
  const type = useBrandTypography();
  const insets = useContext(SafeAreaInsetsContext) ?? { top: 0, bottom: 0 };
  const { type: workType, workDate, amount, expected, update } = useWorkDraft();
  const [touched, setTouched] = useState(false);
  const save = useSaveFirstWork();

  const cents = parseBRLToCents(amount);
  const missingAmount = cents === null;
  const missingExpected = expected === null;

  function chooseTerm(days: number) {
    if (workDate === null) return;
    update({ expected: { kind: 'date', date: addDaysToLocalDate(workDate, days) } });
  }

  function submit() {
    setTouched(true);
    if (cents === null || expected === null) return;
    save.mutate(undefined, { onSuccess: () => router.push('/first-work-done') });
  }

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 24) + 20 },
      ]}
      testID="first-work-amount"
    >
      <StatusBar style="dark" />
      <OnboardingHeader step={7} onBack={() => router.back()} testID="work-amount-header" />

      <View style={styles.heading}>
        {workType && <WorkTypeChip type={workType} />}
        <AppText accessibilityRole="header" style={[type.heading1, styles.title]}>
          {t('firstWork.amount.title')}
        </AppText>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.body}
      >
        <View style={styles.content}>
          <MoneyInput
            variant="work"
            label={t('firstWork.amount.label')}
            error={touched && missingAmount ? t('firstWork.amount.required') : undefined}
            value={amount}
            onChangeText={(value) => update({ amount: value })}
            testID="work-amount-input"
          />

          <View style={styles.expected}>
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
                  </AppText>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('firstWork.amount.change')}
                  onPress={() => update({ expected: null })}
                  testID="work-expected-change"
                  style={({ pressed }) => [styles.change, pressed && styles.pressed]}
                >
                  <AppText variant="technical" style={styles.changeLabel}>
                    {t('firstWork.amount.change')}
                  </AppText>
                </Pressable>
              </View>
            )}

            <View style={styles.terms}>
              {PAYMENT_TERMS.map((days) => {
                const date = workDate === null ? null : addDaysToLocalDate(workDate, days);
                const selected = expected?.kind === 'date' && expected.date === date;
                return (
                  <Pressable
                    key={days}
                    accessibilityRole="button"
                    accessibilityLabel={t('firstWork.amount.inDays', { days })}
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
                      {t('firstWork.amount.inDays', { days })}
                    </AppText>
                  </Pressable>
                );
              })}
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
        </View>

        <View style={styles.footer}>
          <OnboardingCta
            label={t('firstWork.amount.submit')}
            loading={save.isPending}
            onPress={submit}
            testID="work-amount-cta"
          />
        </View>
      </KeyboardAvoidingView>
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
  body: { flex: 1, marginTop: 24 },
  content: { flex: 1, marginHorizontal: 32, gap: 24 },
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
  change: { minHeight: 44, justifyContent: 'center' },
  changeLabel: { fontSize: 10, lineHeight: 14, letterSpacing: 1.4, color: palette.bronze },
  terms: { flexDirection: 'row', gap: 6 },
  term: { flex: 1, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  termOn: { borderWidth: 1, borderColor: colors.foreground, backgroundColor: colors.foreground },
  termOff: { borderWidth: 1, borderColor: 'rgba(16,22,15,0.18)' },
  termOnText: { fontSize: 13, lineHeight: 17, color: palette.cream },
  termOffText: { fontSize: 13, lineHeight: 17, color: colors.textPrimary },
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
  footer: { marginHorizontal: 32, paddingTop: 12 },
});
