import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { colors, premiumGateMetrics as m, palette } from '@/theme/tokens';
import { AppText } from './AppText';
import { LockClosedIcon } from './icons/heroicons';

/** Cadeado de Agenda 12/14 e Finanças (Heroicons Solid `lock-closed`). */
export function PremiumLockIcon({
  color = palette.bronzeDeep,
  size = 10,
}: {
  color?: string;
  size?: number;
}) {
  // O desenho da Heroicons tem folga interna: um pouco maior para ocupar o mesmo espaço.
  return <LockClosedIcon size={Math.round(size * 1.2)} color={color} />;
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
