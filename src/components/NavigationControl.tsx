import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import X from 'lucide-react-native/icons/x';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, navigationMetrics } from '@/theme/tokens';

type Props = { kind: 'back' | 'close'; onPress: () => void };

/** A 40-point circle inside a 44-point accessible touch target. */
export function NavigationControl({ kind, onPress }: Props) {
  const { t } = useTranslation('navigation');
  const Icon = kind === 'back' ? ChevronLeft : X;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t(kind === 'back' ? 'actions.back' : 'actions.close')}
      onPress={onPress}
      style={styles.target}
      testID={`navigation-${kind}`}
    >
      <View style={styles.circle}>
        <Icon color={colors.foreground} size={navigationMetrics.navigationControlIconSize} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  target: {
    width: navigationMetrics.navigationControlHitTarget,
    height: navigationMetrics.navigationControlHitTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: navigationMetrics.navigationControlDiameter,
    height: navigationMetrics.navigationControlDiameter,
    borderRadius: navigationMetrics.navigationControlDiameter / 2,
    borderWidth: 1,
    borderColor: colors.navigationControlBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
