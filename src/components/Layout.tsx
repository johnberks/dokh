import { type ReactNode, useContext } from 'react';
import { ScrollView, type ScrollViewProps, StyleSheet, View, type ViewProps } from 'react-native';
import {
  SafeAreaInsetsContext,
  SafeAreaView,
  type SafeAreaViewProps,
} from 'react-native-safe-area-context';
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

export type TwoToneScrollScreenProps = Omit<
  ScrollViewProps,
  'children' | 'contentContainerStyle'
> & {
  hero: ReactNode;
  children: ReactNode;
  /** Fundo do topo (ex.: manchas com blur): cobre também a área da barra de status. */
  heroBackground?: ReactNode;
  heroStyle?: ViewProps['style'];
  bodyStyle?: ViewProps['style'];
};

/** Home/Finanças: one vertical scroll owns both the green hero and cream body. */
export function TwoToneScrollScreen({
  hero,
  children,
  heroBackground,
  heroStyle,
  bodyStyle,
  ...props
}: TwoToneScrollScreenProps) {
  const insets = useContext(SafeAreaInsetsContext) ?? { top: 0, bottom: 0 };
  return (
    <View style={styles.twoToneScreen}>
      <ScrollView
        {...props}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        contentContainerStyle={styles.twoToneContent}
        showsVerticalScrollIndicator={props.showsVerticalScrollIndicator ?? false}
        keyboardShouldPersistTaps={props.keyboardShouldPersistTaps ?? 'handled'}
        testID={props.testID ?? 'two-tone-scroll'}
      >
        {/* Ao puxar a tela para baixo (bounce do iOS), o topo continua escuro, nunca creme. */}
        <View pointerEvents="none" style={styles.twoToneBleed} testID="two-tone-bleed" />
        <View
          testID="two-tone-hero"
          style={[styles.twoToneHero, { paddingTop: insets.top }, heroStyle]}
        >
          {heroBackground}
          {hero}
        </View>
        <View testID="two-tone-body" style={[styles.twoToneBody, bodyStyle]}>
          {children}
        </View>
      </ScrollView>
    </View>
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
  twoToneScreen: { flex: 1, backgroundColor: colors.background },
  twoToneContent: { flexGrow: 1 },
  twoToneHero: { backgroundColor: colors.darkBackground },
  twoToneBleed: {
    position: 'absolute',
    top: -1000,
    left: 0,
    right: 0,
    height: 1000,
    backgroundColor: colors.darkBackground,
  },
  twoToneBody: {
    flexGrow: 1,
    backgroundColor: colors.background,
    paddingBottom: spacing.xl,
  },
});
