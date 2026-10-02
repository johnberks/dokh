import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { formatDayMonth, type LocalDate } from '@/domain/calendar';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { colors, palette } from '@/theme/tokens';

/**
 * "Já recebi" (7.7): só aparece quando a data prevista é hoje ou já passou. Começa em
 * "Ainda não": recebido é sempre escolha da pessoa, nunca presunção do app (D34).
 */
export function ReceivedChoice({
  date,
  received,
  onChange,
  testID = 'work-received',
}: {
  date: LocalDate;
  received: boolean;
  onChange: (received: boolean) => void;
  testID?: string;
}) {
  const { t } = useTranslation('agenda');
  const type = useBrandTypography();

  return (
    <View style={styles.block} testID={testID}>
      <AppText style={[type.heading1, styles.question]}>{t('form.received.question')}</AppText>
      <View accessibilityRole="radiogroup" style={styles.row}>
        {([false, true] as const).map((value) => {
          const selected = received === value;
          const label = value ? t('form.received.yes') : t('form.received.no');
          return (
            <Pressable
              key={label}
              accessibilityRole="radio"
              accessibilityLabel={label}
              accessibilityState={{ checked: selected }}
              onPress={() => onChange(value)}
              testID={`${testID}-${value ? 'yes' : 'no'}`}
              style={({ pressed }) => [
                styles.option,
                selected ? styles.optionOn : styles.optionOff,
                pressed && styles.pressed,
              ]}
            >
              <AppText style={selected ? styles.labelOn : styles.labelOff}>{label}</AppText>
            </Pressable>
          );
        })}
      </View>
      <AppText style={styles.note}>
        {received
          ? t('form.received.receivedNote', { date: formatDayMonth(date) })
          : t('form.received.pendingNote')}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: 10 },
  question: {
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.15,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  row: { flexDirection: 'row', gap: 8 },
  option: { flex: 1, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  optionOn: { borderWidth: 1, borderColor: colors.foreground, backgroundColor: colors.foreground },
  optionOff: { borderWidth: 1, borderColor: 'rgba(16,22,15,0.18)' },
  labelOn: { fontSize: 14, lineHeight: 18, color: palette.cream },
  labelOff: { fontSize: 14, lineHeight: 18, color: colors.textPrimary },
  note: { fontSize: 12, lineHeight: 17, color: palette.sage, textAlign: 'center' },
  pressed: { opacity: 0.72 },
});
