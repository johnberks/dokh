import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { formatCentsToBRL } from '@/domain/money';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { colors, palette, type WorkLocationColorToken, workLocationColors } from '@/theme/tokens';
import type { WorkTemplate } from '../work-templates';

/** Card compacto de "Usar novamente" (Agenda 06): local, tipo · duração · valor e último horário. */
export function WorkTemplateCard({
  template,
  onPress,
}: {
  template: WorkTemplate;
  onPress: () => void;
}) {
  const { t } = useTranslation('components');
  const type = useBrandTypography();
  const hours =
    template.durationMinutes === null
      ? null
      : `${Math.floor(template.durationMinutes / 60)}h${
          template.durationMinutes % 60
            ? String(template.durationMinutes % 60).padStart(2, '0')
            : ''
        }`;
  const meta = [
    t(`workType.${template.type}.title` as 'workType.shift.title'),
    hours,
    formatCentsToBRL(template.amountCents, { omitZeroCents: true }),
  ]
    .filter((part): part is string => part !== null)
    .join(' · ');
  const color =
    workLocationColors[template.colorToken as WorkLocationColorToken] ?? palette.workSage;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${template.locationName}, ${meta}${
        template.startTime ? `, ${template.startTime}` : ''
      }`}
      onPress={onPress}
      testID={`work-template-${template.locationId}`}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={[styles.dot, { backgroundColor: color }]} />
      <View style={styles.identity}>
        <AppText numberOfLines={1} style={[type.heading1, styles.place]}>
          {template.locationName}
        </AppText>
        <AppText numberOfLines={1} style={styles.meta}>
          {meta}
        </AppText>
      </View>
      {template.startTime ? <AppText style={styles.last}>{template.startTime}</AppText> : null}
      <View style={styles.arrow}>
        <AppText style={styles.arrowText}>{'→'}</AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F8F6EF',
    borderWidth: 1,
    borderColor: 'rgba(16,22,15,0.16)',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: colors.foreground,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3,
  },
  cardPressed: { transform: [{ translateY: 1 }], backgroundColor: '#F3F0E7' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  identity: { flex: 1, gap: 2 },
  place: { fontSize: 16, lineHeight: 20, letterSpacing: -0.16, color: colors.textPrimary },
  meta: { fontSize: 13, lineHeight: 17, color: palette.mutedCopy },
  last: { fontSize: 13, lineHeight: 17, color: palette.sage },
  arrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(16,22,15,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: { fontSize: 13, lineHeight: 16, color: colors.textPrimary },
});
