import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { colors, premiumGateMetrics as m, palette } from '@/theme/tokens';
import { AppText } from './AppText';

/** Cadeado de Agenda 12/14 e Finanças (viewBox 10×12, traço 1,4). */
export function PremiumLockIcon({
  color = palette.bronzeDeep,
  size = 10,
}: {
  color?: string;
  size?: number;
}) {
  return (
    <Svg width={size * 0.9} height={size} viewBox="0 0 10 12" fill="none" accessible={false}>
      <Rect x={1} y={5} width={8} height={6.3} rx={1.5} stroke={color} strokeWidth={1.4} />
      <Path d="M3 5V3.5a2 2 0 0 1 4 0V5" stroke={color} strokeWidth={1.4} />
    </Svg>
  );
}

type Props = {
  /** `full` = "DOKH PREMIUM" (folhas da Agenda); `short` = "PREMIUM" (cartões de Finanças). */
  size?: 'full' | 'short';
  testID?: string;
};

/** Selo discreto de recurso Premium. Informativo, não é botão. */
export function PremiumBadge({ size = 'full', testID }: Props) {
  const { t } = useTranslation('components');
  return (
    <View testID={testID} style={styles.badge}>
      <PremiumLockIcon />
      <AppText variant="technical" style={styles.label}>
        {size === 'full' ? t('premium.badge') : t('premium.badgeShort')}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.badgeGap,
    borderWidth: 1,
    borderColor: colors.premiumBadgeBorder,
    borderRadius: m.badgeRadius,
    paddingVertical: m.badgePaddingVertical,
    paddingHorizontal: m.badgePaddingHorizontal,
  },
  label: {
    fontSize: m.badgeFontSize,
    lineHeight: 12,
    letterSpacing: m.badgeTracking,
    color: colors.reviewBronzeText,
  },
});
