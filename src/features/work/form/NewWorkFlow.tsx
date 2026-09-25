import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, BackHandler, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { BottomSheet } from '@/components/BottomSheet';
import { NavigationControl } from '@/components/NavigationControl';
import { WorkTypeSelector } from '@/components/WorkTypeSelector';
import type { WorkType } from '@/domain/work-type';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { colors, navigationMetrics, palette } from '@/theme/tokens';
import { useNewWorkDraft } from '../work-draft';
import { templateDraft, useWorkTemplates, type WorkTemplate } from '../work-templates';
import { WorkForm, type WorkFormSheet } from './WorkForm';
import { WorkTemplateCard } from './WorkTemplateCard';

type Step = { kind: 'entry' } | { kind: 'form'; initialSheet: WorkFormSheet };

/**
 * Fluxo do `+` (Agenda 06 → 06B → 07). O `+` central e o da Agenda abrem o mesmo fluxo.
 * Sem histórico, não há o que reutilizar: o fluxo abre direto na escolha do tipo. Com
 * histórico, mostra "Usar novamente" (templates) e "Criar novo trabalho" (pedido do usuário,
 * 2026-09-25).
 */
export function NewWorkFlow({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation('agenda');
  const type = useBrandTypography();
  const templates = useWorkTemplates();
  const [step, setStep] = useState<Step>({ kind: 'entry' });
  const [choosingType, setChoosingType] = useState(false);
  const known = templates.data ?? [];
  // Falha ao ler o histórico não impede criar: cai na escolha de tipo.
  const hasHistory = known.length > 0;

  // Cada abertura do fluxo começa limpa.
  useEffect(() => {
    useNewWorkDraft.getState().reset();
    return () => useNewWorkDraft.getState().reset();
  }, []);

  // No formulário, o voltar do Android retorna ao início do fluxo em vez de fechá-lo.
  useEffect(() => {
    if (step.kind !== 'form') return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      setStep({ kind: 'entry' });
      return true;
    });
    return () => subscription.remove();
  }, [step.kind]);

  function startNew(workType: WorkType) {
    useNewWorkDraft.getState().reset();
    useNewWorkDraft.getState().update({ type: workType });
    setChoosingType(false);
    setStep({ kind: 'form', initialSheet: null });
  }

  function reuse(template: WorkTemplate) {
    useNewWorkDraft.getState().reset();
    useNewWorkDraft.getState().update(templateDraft(template));
    setStep({ kind: 'form', initialSheet: 'date' });
  }

  if (step.kind === 'form') {
    return (
      <WorkForm
        initialSheet={step.initialSheet}
        onBack={() => {
          useNewWorkDraft.getState().reset();
          setStep({ kind: 'entry' });
        }}
        onSaved={onClose}
      />
    );
  }

  const header = (title: string, description?: string) => (
    <View style={styles.header}>
      <NavigationControl kind="close" onPress={onClose} />
      <View style={styles.heading}>
        <AppText accessibilityRole="header" variant="modalTitle">
          {title}
        </AppText>
        {description ? (
          <AppText variant="modalDescription" style={styles.description}>
            {description}
          </AppText>
        ) : null}
      </View>
    </View>
  );

  if (templates.isPending) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.screen} testID="new-work-loading">
        {header(t('newWork.title'))}
        <ActivityIndicator color={palette.sage} style={styles.loading} />
      </SafeAreaView>
    );
  }

  if (!hasHistory) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.screen} testID="new-work-type-step">
        {header(t('newWork.typeSheetTitle'))}
        <View style={styles.typeList}>
          <WorkTypeSelector
            variant="menu"
            label={t('newWork.typeSheetTitle')}
            onSelect={startNew}
            testID="new-work-type"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen} testID="new-work-start">
      {header(t('newWork.title'), t('newWork.description'))}

      <View style={styles.section}>
        <AppText variant="technical" style={styles.sectionLabel}>
          {t('newWork.reuse')}
        </AppText>
        {known.map((template) => (
          <WorkTemplateCard
            key={template.key}
            template={template}
            onPress={() => reuse(template)}
          />
        ))}
      </View>

      <View style={styles.divider}>
        <View style={styles.rule} />
        <AppText variant="technical" style={styles.sectionLabel}>
          {t('newWork.or')}
        </AppText>
        <View style={styles.rule} />
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
          onSelect={startNew}
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
  loading: { marginTop: 48 },
  typeList: { paddingHorizontal: 24, paddingTop: 28 },
  section: { paddingHorizontal: 24, paddingTop: 32, gap: 12 },
  sectionLabel: { fontSize: 10, lineHeight: 14, letterSpacing: 1.8, color: palette.sage },
  divider: {
    paddingHorizontal: 24,
    paddingTop: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  rule: { flex: 1, height: 1, backgroundColor: 'rgba(16,22,15,0.12)' },
  create: { paddingHorizontal: 24, paddingTop: 24, gap: 12 },
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
