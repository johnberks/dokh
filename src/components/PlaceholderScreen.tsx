import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { colors, spacing } from '@/theme/tokens';

type Props = { title: string; children?: ReactNode };

/** Tela provisória das rotas até cada seção ser implementada. */
export function PlaceholderScreen({ title, children }: Props) {
  const typography = useBrandTypography();
  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={[styles.title, typography.heading2]}>
        {title}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.base,
    backgroundColor: colors.background,
  },
  title: { color: colors.textPrimary },
});
