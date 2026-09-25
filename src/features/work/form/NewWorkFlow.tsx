import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BackHandler, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { BottomSheet } from '@/components/BottomSheet';
import { NavigationControl } from '@/components/NavigationControl';
import { WorkTypeSelector } from '@/components/WorkTypeSelector';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { colors, navigationMetrics, palette } from '@/theme/tokens';
import { useNewWorkDraft } from '../work-draft';
import { WorkForm } from './WorkForm';

/**
 * Fluxo do `+` (Agenda 06 → 06B → 07). O `+` central e o da Agenda abrem o mesmo fluxo.
 * "Usar novamente" (templates do histórico) entra na 6.6; aqui fica o caminho "Criar novo".
 */
export function NewWorkFlow({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation('agenda');
  const type = useBrandTypography();
  const [step, setStep] = useState<'start' | 'form'>('start');
  const [choosingType, setChoosingType] = useState(false);

  // Cada abertura do fluxo começa limpa.
  useEffect(() => {
    useNewWorkDraft.getState().reset();
    return () => useNewWorkDraft.getState().reset();
  }, []);

  // No formulário, o voltar do Android retorna ao início do fluxo em vez de fechá-lo.
  useEffect(() => {
    if (step !== 'form') return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      setStep('start');
      return true;
    });
    return () => subscription.remove();
  }, [step]);

  if (step === 'form') {
    return (
      <WorkForm
        onBack={() => {
          useNewWorkDraft.getState().reset();
          setStep('start');
        }}
        onSaved={onClose}
      />
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen} testID="new-work-start">
      <View style={styles.header}>
        <NavigationControl kind="close" onPress={onClose} />
        <View style={styles.heading}>
          <AppText accessibilityRole="header" variant="modalTitle">
            {t('newWork.title')}
          </AppText>
          <AppText variant="modalDescription" style={styles.description}>
            {t('newWork.description')}
          </AppText>
        </View>
      </View>

      <View style={styles.create}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('newWork.createNew')}
          accessibilityHint={t('newWork.createNewHint')}
          onPress={() => setChoosingType(true)}
          testID="new-work-create"
          style={({ pressed }) => [styles.createButton, pressed && styles.pressed]}
        >
          <AppText style={[type.heading1, styles.createLabel]}>{t('newWork.createNew')}</AppText>
          <AppText accessible={false} style={[type.heading1, styles.createPlus]}>
            {'+'}
          </AppText>
        </Pressable>
        <AppText style={styles.createHint}>{t('newWork.createNewHint')}</AppText>
      </View>

      <BottomSheet
        open={choosingType}
        onClose={() => setChoosingType(false)}
        accessibilityLabel={t('newWork.typeSheetTitle')}
        testID="new-work-type-sheet"
      >
        <AppText accessibilityRole="header" style={[type.heading1, styles.sheetTitle]}>
          {t('newWork.typeSheetTitle')}
        </AppText>
        <WorkTypeSelector
          variant="menu"
          label={t('newWork.typeSheetTitle')}
          onSelect={(workType) => {
            useNewWorkDraft.getState().reset();
            useNewWorkDraft.getState().update({ type: workType });
            setChoosingType(false);
            setStep('form');
          }}
          testID="new-work-type"
        />
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingTop: navigationMetrics.modalTop,
    paddingHorizontal: navigationMetrics.modalHorizontal,
  },
  heading: {
    marginTop: navigationMetrics.modalHeadingGap,
    gap: navigationMetrics.modalDescriptionGap,
  },
  description: { color: colors.textMuted },
  create: { paddingHorizontal: 24, paddingTop: 32, gap: 12 },
  createButton: {
    minHeight: 60,
    borderRadius: 16,
    backgroundColor: colors.foreground,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  createLabel: { fontSize: 16, lineHeight: 20, letterSpacing: 0, color: palette.cream },
  createPlus: { fontSize: 20, lineHeight: 22, letterSpacing: 0, color: palette.bronze },
  createHint: { fontSize: 13, lineHeight: 20, color: palette.sage, textAlign: 'center' },
  sheetTitle: { fontSize: 22, lineHeight: 26, letterSpacing: -0.44, color: colors.textPrimary },
  pressed: { opacity: 0.72 },
});
