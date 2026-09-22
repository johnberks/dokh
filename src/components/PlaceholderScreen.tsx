import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '@/theme/tokens';

type Props = { title: string; children?: ReactNode };

/** Tela provisória das rotas até cada seção ser implementada. */
export function PlaceholderScreen({ title, children }: Props) {
  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.title}>
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
  title: { color: colors.textPrimary, ...typography.heading2 },
});
