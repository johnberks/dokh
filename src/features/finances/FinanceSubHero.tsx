import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { palette } from '@/theme/tokens';

/**
 * Topo escuro das telas filhas de Finanças (Entradas e análise de valor/hora): voltar para
 * Finanças, rótulo técnico opcional e título. `overlap` reserva o espaço do bloco que sobe
 * sobre o verde, como o calendário da Agenda.
 */
export function FinanceSubHero({
  title,
  eyebrow,
  children,
  overlap = 0,
  testID,
}: {
  title: string;
  eyebrow?: string;
  children?: ReactNode;
  overlap?: number;
  testID: string;
}) {
  const { t } = useTranslation('finances');
  const type = useBrandTypography();
  return (
    <View style={[styles.hero, { paddingBottom: 24 + overlap }]}>
      <StatusBar style="light" />
      <View style={styles.content}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('entries.back')}
          hitSlop={8}
          onPress={() => router.back()}
          testID={`${testID}-back`}
          style={({ pressed }) => [styles.back, pressed && styles.pressed]}
        >
          <ChevronLeft color={palette.secondaryText} size={18} />
          <AppText style={styles.backText}>{t('entries.backLabel')}</AppText>
        </Pressable>
        <View style={styles.titleBlock}>
          {eyebrow ? (
            <AppText variant="technical" style={styles.eyebrow}>
              {eyebrow}
            </AppText>
          ) : null}
          <AppText accessibilityRole="header" style={[type.heading1, styles.title]}>
            {title}
          </AppText>
        </View>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { overflow: 'hidden' },
  content: { paddingTop: 14, paddingHorizontal: 24, gap: 14 },
  back: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 32,
    marginLeft: -4,
  },
  backText: { fontSize: 14, lineHeight: 18, color: palette.secondaryText },
  titleBlock: { gap: 6 },
  eyebrow: { fontSize: 10, lineHeight: 14, letterSpacing: 1.8, color: palette.sage },
  title: { fontSize: 26, lineHeight: 30, letterSpacing: -0.78, color: palette.cream },
  pressed: { opacity: 0.72 },
});
