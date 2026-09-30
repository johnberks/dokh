import type { ReactNode } from 'react';
import { type StyleProp, StyleSheet, type TextStyle } from 'react-native';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { colors, fontAliases, palette } from '@/theme/tokens';
import { AppText } from './AppText';

export type CardLabelTone = 'default' | 'structure' | 'bronze' | 'attention' | 'onDark';

/**
 * Título técnico dos cards (`ORIGEM DAS ENTRADAS`, `PRÓXIMA ENTRADA`...), no modelo do
 * `GANHOS DE 2026` aprovado pelo usuário: Plex Mono semibold, escuro e espaçado. O rótulo
 * sálvia de 10 pt em peso regular ficava apagado. Plex Mono tem um arquivo por peso, então o
 * negrito vem do semibold carregado (fontWeight não tem efeito).
 */
export function CardLabel({
  children,
  tone = 'default',
  style,
  numberOfLines,
  testID,
}: {
  children: ReactNode;
  tone?: CardLabelTone;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  testID?: string;
}) {
  const type = useBrandTypography();
  const plexLoaded = type.technical.fontFamily === fontAliases.plexRegular;
  return (
    <AppText
      variant="technical"
      numberOfLines={numberOfLines}
      testID={testID}
      style={[styles.label, plexLoaded ? styles.semibold : styles.systemBold, TONE[tone], style]}
    >
      {children}
    </AppText>
  );
}

const TONE = StyleSheet.create({
  default: { color: colors.textPrimary },
  structure: { color: palette.structure },
  bronze: { color: palette.bronze },
  attention: { color: colors.reviewBronzeText },
  onDark: { color: palette.cream },
});

const styles = StyleSheet.create({
  label: { fontSize: 11, lineHeight: 15, letterSpacing: 1.65 },
  semibold: { fontFamily: fontAliases.plexSemibold },
  systemBold: { fontWeight: '600' },
});
