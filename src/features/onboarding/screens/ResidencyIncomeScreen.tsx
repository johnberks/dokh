import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
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
import { MutationError } from '@/components/TechnicalStates';
import { parseBRLToCents } from '@/domain/money';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { colors, onboardingProfileMetrics as m, palette } from '@/theme/tokens';
import { OnboardingCta } from '../OnboardingCta';
import { OnboardingHeader } from '../OnboardingHeader';
import { useProfileDraft } from '../profile-draft';
import { useSaveProfile } from '../use-save-profile';

const QUICK_DAYS = [1, 5, 10, 15, 20] as const;
const CUSTOM_DAYS = [
  2, 3, 4, 6, 7, 8, 9, 11, 12, 13, 14, 16, 17, 18, 19, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31,
];

/** TELA 04: bolsa mensal e dia de entrada. Só aparece para quem faz residência. */
export function ResidencyIncomeScreen() {
  const { t } = useTranslation('onboarding');
  const type = useBrandTypography();
  const insets = useContext(SafeAreaInsetsContext) ?? { top: 0, bottom: 0 };
  const { displayName, residencyProgram, monthlyAmount, paymentDay, update } = useProfileDraft();
  const [touched, setTouched] = useState(false);
  const [showAllDays, setShowAllDays] = useState(false);
  const save = useSaveProfile();

  const cents = parseBRLToCents(monthlyAmount);
  const missingAmount = cents === null;
  const missingDay = paymentDay === null;

  function submit() {
    setTouched(true);
    if (cents === null || paymentDay === null) return;
    save.mutate(
      {
        displayName,
        isResident: true,
        residencyProgram,
        monthlyAmountCents: cents,
        paymentDay,
      },
      { onSuccess: () => router.push('/profile-ready') },
    );
  }

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 24) + 20 },
      ]}
      testID="onboarding-residency-income"
    >
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          showsVerticalScrollIndicator={false}
          style={styles.flex}
          testID="income-scroll"
        >
          <OnboardingHeader step={3} onBack={() => router.back()} testID="income-header" />

          <View style={styles.heading}>
            <View style={styles.badge}>
              <View style={styles.badgeDot} />
              <AppText variant="technical" style={styles.badgeLabel}>
                {t('profile.income.badge', { specialty: residencyProgram.toUpperCase() })}
              </AppText>
            </View>
            <AppText accessibilityRole="header" style={[type.heading1, styles.title]}>
              {t('profile.income.title')}
            </AppText>
          </View>

          <View style={styles.body}>
            <View style={styles.block}>
              <AppText style={[type.heading1, styles.question]}>
                {t('profile.income.amountTitle')}
              </AppText>
              <MoneyInput
                variant="residency"
                label={t('profile.income.amountLabel')}
                hint={t('profile.income.amountHint')}
                error={touched && missingAmount ? t('profile.income.amountRequired') : undefined}
                value={monthlyAmount}
                onChangeText={(value) => update({ monthlyAmount: value })}
                testID="income-amount"
              />
            </View>

            <View style={styles.block}>
              <AppText style={[type.heading1, styles.question]}>
                {t('profile.income.dayTitle')}
              </AppText>
              <View style={styles.dayRow}>
                <AppText style={styles.dayPrefix}>{t('profile.income.dayPrefix')}</AppText>
                <View style={styles.dayBox} testID="income-day-current">
                  <AppText style={[type.heading1, styles.dayBoxValue]}>
                    {paymentDay === null ? '--' : String(paymentDay).padStart(2, '0')}
                  </AppText>
                </View>
              </View>
              <View
                accessibilityRole="radiogroup"
                accessibilityLabel={t('profile.income.dayLabel')}
                style={styles.dayGrid}
              >
                {QUICK_DAYS.map((day) => (
                  <Pressable
                    key={day}
                    accessibilityRole="radio"
                    accessibilityLabel={String(day)}
                    accessibilityState={{ checked: paymentDay === day }}
                    onPress={() => update({ paymentDay: day })}
                    testID={`income-day-${day}`}
                    style={({ pressed }) => [
                      styles.dayChip,
                      paymentDay === day ? styles.dayChipOn : styles.dayChipOff,
                      pressed && styles.pressed,
                    ]}
                  >
                    <AppText
                      style={[
                        type.heading1,
                        paymentDay === day ? styles.dayChipOnText : styles.dayChipOffText,
                      ]}
                    >
                      {String(day).padStart(2, '0')}
                    </AppText>
                  </Pressable>
                ))}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('profile.income.dayOther')}
                  accessibilityState={{ expanded: showAllDays }}
                  onPress={() => setShowAllDays((open) => !open)}
                  testID="income-day-other"
                  style={({ pressed }) => [
                    styles.dayChip,
                    styles.dayChipOff,
                    pressed && styles.pressed,
                  ]}
                >
                  <AppText style={styles.dayOtherText}>{t('profile.income.dayOther')}</AppText>
                </Pressable>
              </View>

              {showAllDays && (
                <View style={styles.dayGrid} testID="income-day-all">
                  {CUSTOM_DAYS.map((day) => (
                    <Pressable
                      key={day}
                      accessibilityRole="radio"
                      accessibilityLabel={String(day)}
                      accessibilityState={{ checked: paymentDay === day }}
                      onPress={() => update({ paymentDay: day })}
                      testID={`income-day-${day}`}
                      style={({ pressed }) => [
                        styles.dayChip,
                        paymentDay === day ? styles.dayChipOn : styles.dayChipOff,
                        pressed && styles.pressed,
                      ]}
                    >
                      <AppText
                        style={[
                          type.heading1,
                          paymentDay === day ? styles.dayChipOnText : styles.dayChipOffText,
                        ]}
                      >
                        {String(day).padStart(2, '0')}
                      </AppText>
                    </Pressable>
                  ))}
                </View>
              )}

              <AppText style={styles.dayHint}>
                {touched && missingDay
                  ? t('profile.income.dayRequired')
                  : t('profile.income.dayHint')}
              </AppText>
            </View>

            {save.isError && <MutationError onRetry={submit} retrying={save.isPending} />}
          </View>

          <View style={styles.footer}>
            <OnboardingCta loading={save.isPending} onPress={submit} testID="income-cta" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  heading: { marginTop: 40, marginHorizontal: 32, gap: 12 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badgeDot: { width: 7, height: 7, backgroundColor: palette.workSage },
  badgeLabel: { fontSize: 10, lineHeight: 14, letterSpacing: 1.8, color: palette.sage },
  title: { fontSize: 28, lineHeight: 31, letterSpacing: -0.84, color: colors.textPrimary },
  flex: { flex: 1 },
  // Rolagem da tela inteira, só quando o conteúdo não couber.
  content: { flexGrow: 1 },
  body: { flex: 1, marginTop: 32, paddingHorizontal: 32, paddingBottom: 24, gap: 30 },
  block: { gap: 12 },
  question: { fontSize: 17, lineHeight: 22, letterSpacing: -0.17, color: colors.textPrimary },
  dayRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  dayPrefix: { fontSize: 16, lineHeight: 20, color: colors.textMuted },
  dayBox: {
    width: m.dayBoxWidth,
    height: m.dayBoxHeight,
    borderRadius: m.choiceRadius,
    borderWidth: 1.5,
    borderColor: colors.foreground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBoxValue: { fontSize: 30, lineHeight: 34, letterSpacing: 0, color: colors.textPrimary },
  dayGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  dayChip: {
    width: 48,
    height: m.dayChipHeight,
    borderRadius: m.dayChipRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayChipOn: { borderWidth: 1, borderColor: colors.foreground, backgroundColor: colors.foreground },
  dayChipOff: { borderWidth: 1, borderColor: 'rgba(16,22,15,0.18)' },
  dayChipOnText: { fontSize: 15, lineHeight: 19, letterSpacing: 0, color: palette.cream },
  dayChipOffText: { fontSize: 15, lineHeight: 19, letterSpacing: 0, color: colors.textPrimary },
  dayOtherText: { fontSize: 13, lineHeight: 17, color: colors.textMuted },
  dayHint: { fontSize: 13, lineHeight: 18, color: palette.sage },
  pressed: { opacity: 0.72 },
  footer: { paddingHorizontal: 32, paddingTop: 12 },
});
