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
 * Topo escuro das telas filhas de Finanças (Entradas e análise de valor/hora). Uma barra só:
 * voltar em círculo à esquerda e, no centro, o conteúdo da tela (em Entradas, o rótulo e a troca
 * de mês). Título grande opcional abaixo (análise). `overlap` reserva o espaço do bloco que sobe
 * sobre o verde, como o calendário da Agenda.
 */
export function FinanceSubHero({
  center,
  title,
  eyebrow,
  overlap = 0,
  testID,
}: {
  center?: ReactNode;
  title?: string;
  eyebrow?: string;
  overlap?: number;
  testID: string;
}) {
  const { t } = useTranslation('finances');
  const type = useBrandTypography();
  return (
    <View style={[styles.hero, { paddingBottom: 24 + overlap }]}>
      <StatusBar style="light" />
      <View style={styles.content}>
        <View style={styles.bar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('entries.back')}
            onPress={() => router.back()}
            testID={`${testID}-back`}
            style={({ pressed }) => [styles.back, pressed && styles.pressed]}
          >
            <ChevronLeft color={palette.cream} size={20} />
          </Pressable>
          <View style={styles.center}>{center}</View>
          <View style={styles.spacer} />
        </View>
        {title ? (
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
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { overflow: 'hidden' },
  content: { paddingTop: 12, paddingHorizontal: 20, gap: 18 },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  // Mesmo botão de voltar do detalhe do trabalho.
  back: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(237,234,224,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { flex: 1, minWidth: 0, alignItems: 'center' },
  spacer: { width: 44 },
  titleBlock: { gap: 6, paddingHorizontal: 4 },
  eyebrow: { fontSize: 10, lineHeight: 14, letterSpacing: 1.8, color: palette.sage },
  title: { fontSize: 26, lineHeight: 30, letterSpacing: -0.78, color: palette.cream },
  pressed: { opacity: 0.72 },
});
