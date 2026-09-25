import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { WorkTypeSelector } from '@/components/WorkTypeSelector';
import { OnboardingCta } from '@/features/onboarding/OnboardingCta';
import { OnboardingHeader } from '@/features/onboarding/OnboardingHeader';
import { useProfileDraft } from '@/features/onboarding/profile-draft';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { colors, onboardingProfileMetrics as m, palette } from '@/theme/tokens';
import { useWorkDraft } from '../work-draft';

/** TELA 06: tipo do primeiro Trabalho. Residência não aparece: é gerenciada em Perfil. */
export function WorkTypeScreen() {
  const { t } = useTranslation('onboarding');
  const type = useBrandTypography();
  const insets = useContext(SafeAreaInsetsContext) ?? { top: 0, bottom: 0 };
  const isResident = useProfileDraft((state) => state.isResident);
  const { type: selected, update } = useWorkDraft();
  const [touched, setTouched] = useState(false);

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 24) + 20 },
      ]}
      testID="first-work-type"
    >
      <StatusBar style="dark" />
      <OnboardingHeader step={4} onBack={() => router.back()} testID="work-type-header" />

      <View style={styles.heading}>
        <AppText accessibilityRole="header" style={[type.heading1, styles.title]}>
          {t('firstWork.type.title')}
        </AppText>
        <AppText style={styles.description}>{t('firstWork.type.description')}</AppText>
      </View>

      <View style={styles.body}>
        <WorkTypeSelector
          variant="choice"
          label={t('firstWork.type.title')}
          value={selected}
          onChange={(value) => update({ type: value })}
          testID="work-type"
        />
        {isResident === true && (
          <AppText style={styles.note}>{t('firstWork.type.residencyNote')}</AppText>
        )}
        {touched && selected === null && (
          <AppText style={styles.error}>{t('firstWork.type.required')}</AppText>
        )}
      </View>

      <View style={styles.footer}>
        <OnboardingCta
          onPress={() => {
            setTouched(true);
            if (selected === null) return;
            router.push('/work-place');
          }}
          testID="work-type-cta"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  heading: { marginTop: m.titlePaddingTop, marginHorizontal: 32, gap: 12 },
  title: {
    fontSize: m.titleSize,
    lineHeight: m.titleLineHeight,
    letterSpacing: m.titleTracking,
    color: colors.textPrimary,
  },
  description: { fontSize: 15, lineHeight: 23, color: colors.textMuted },
  body: { flex: 1, marginTop: 32, marginHorizontal: 32, gap: 10 },
  note: { paddingTop: 8, fontSize: 13, lineHeight: 18, color: palette.sage },
  error: { fontSize: 13, lineHeight: 18, color: colors.errorFill },
  footer: { paddingHorizontal: 32, paddingTop: 12 },
});
