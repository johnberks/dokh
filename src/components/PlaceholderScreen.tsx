import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = { title: string; children?: ReactNode };

/** Tela provisória das rotas até cada seção ser implementada. Estilos definitivos virão dos tokens (2.1). */
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
    gap: 16,
    backgroundColor: '#EDEAE0',
  },
  title: { color: '#10160F', fontSize: 24, fontWeight: '600' },
});
