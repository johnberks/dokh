import type { ReactNode } from 'react';
import { ScrollView, type ScrollViewProps, StyleSheet, View, type ViewProps } from 'react-native';
import { SafeAreaView, type SafeAreaViewProps } from 'react-native-safe-area-context';
import { colors, radius, shadow, spacing } from '@/theme/tokens';

export function Divider() {
  return <View accessibilityElementsHidden importantForAccessibility="no" style={styles.divider} />;
}

export type CardProps = ViewProps & { children: ReactNode; raised?: boolean };

export function Card({ children, raised = false, style, ...props }: CardProps) {
  return (
    <View {...props} style={[styles.card, raised && shadow.raised, style]}>
      {children}
    </View>
  );
}

export type ScreenProps = SafeAreaViewProps & { children: ReactNode };

export function Screen({ children, style, edges = ['top', 'bottom'], ...props }: ScreenProps) {
  return (
    <SafeAreaView {...props} edges={edges} style={[styles.screen, style]}>
      <View style={styles.screenContent}>{children}</View>
    </SafeAreaView>
  );
}

export type ScrollScreenProps = Omit<ScrollViewProps, 'contentContainerStyle'> & {
  children: ReactNode;
  contentContainerStyle?: ScrollViewProps['contentContainerStyle'];
  edges?: SafeAreaViewProps['edges'];
};

export function ScrollScreen({
  children,
  style,
  contentContainerStyle,
  edges = ['top', 'bottom'],
  ...props
}: ScrollScreenProps) {
  return (
    <SafeAreaView edges={edges} style={[styles.screen, style]}>
      <ScrollView
        {...props}
        keyboardShouldPersistTaps={props.keyboardShouldPersistTaps ?? 'handled'}
        contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  divider: { height: 1, backgroundColor: colors.border },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.base,
    ...shadow.subtle,
  },
  screen: { flex: 1, backgroundColor: colors.background },
  screenContent: { flex: 1, paddingHorizontal: spacing.xl },
  scrollContent: { flexGrow: 1, paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
});
