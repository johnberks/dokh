import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import { Pressable, StyleSheet, View } from 'react-native';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { palette } from '@/theme/tokens';
import { AppText } from './AppText';

export type PeriodSwitcherProps = {
  /** Parte principal do título (`Setembro`, ou `2026` na visão anual). */
  title: string;
  /** Complemento em sálvia (`2026` ao lado do mês). */
  secondary?: string;
  previousLabel: string;
  nextLabel: string;
  onPrevious: () => void;
  onNext: () => void;
  /** Prefixo dos testIDs: `<prefix>-previous`, `<prefix>-title`, `<prefix>-next`. */
  testID: string;
  /** `compact` divide a linha com outro controle (Finanças: seletor Mês/Ano). */
  size?: 'large' | 'compact';
};

/**
 * Troca de período do topo escuro (Agenda 01): `‹ Setembro 2026 ›`. O mesmo componente serve
 * Agenda e Finanças, para a navegação de mês ser idêntica nas duas seções.
 */
export function PeriodSwitcher({
  title,
  secondary,
  previousLabel,
  nextLabel,
  onPrevious,
  onNext,
  testID,
  size = 'large',
}: PeriodSwitcherProps) {
  const type = useBrandTypography();
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={previousLabel}
        hitSlop={6}
        onPress={onPrevious}
        testID={`${testID}-previous`}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <ChevronLeft color={palette.sage} size={22} />
      </Pressable>
      <AppText
        accessibilityRole="header"
        adjustsFontSizeToFit
        numberOfLines={1}
        style={[type.heading1, styles.title, size === 'compact' && styles.titleCompact]}
        testID={`${testID}-title`}
      >
        {title}
        {secondary ? <AppText style={styles.secondary}>{` ${secondary}`}</AppText> : null}
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={nextLabel}
        hitSlop={6}
        onPress={onNext}
        testID={`${testID}-next`}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <ChevronRight color={palette.cream} size={22} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: -8 },
  button: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  title: {
    flexShrink: 1,
    fontSize: 28,
    lineHeight: 30,
    letterSpacing: -0.84,
    color: palette.cream,
  },
  titleCompact: { fontSize: 22, lineHeight: 26, letterSpacing: -0.66 },
  secondary: { color: palette.sage },
  pressed: { opacity: 0.72 },
});
