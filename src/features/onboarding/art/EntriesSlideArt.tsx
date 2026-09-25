import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { colors, onboardingIntroMetrics as m, palette } from '@/theme/tokens';

const MONTH_LAYOUT = [
  { key: 'september', height: 46, color: palette.workSage },
  { key: 'october', height: 60, color: palette.bronze },
  { key: 'november', height: 18, color: palette.structure },
] as const;

/** Exemplo ilustrativo do slide 02: total a receber, distribuição e próximas entradas. */
export function EntriesSlideArt() {
  const { t } = useTranslation('onboarding');
  const months = MONTH_LAYOUT.map((month) => ({
    ...month,
    label: t(`welcome.art.entries.${month.key}` as 'welcome.art.entries.september'),
    amount: t(`welcome.art.entries.${month.key}Amount` as 'welcome.art.entries.septemberAmount'),
  }));
  const entries = [
    {
      place: t('welcome.art.entries.firstPlace'),
      date: t('welcome.art.entries.firstDate'),
      amount: t('welcome.art.entries.firstAmount'),
      indented: false,
    },
    {
      place: t('welcome.art.entries.secondPlace'),
      date: t('welcome.art.entries.secondDate'),
      amount: t('welcome.art.entries.secondAmount'),
      indented: true,
    },
  ];
  return (
    <View style={styles.art}>
      <View style={styles.card}>
        <View style={styles.total}>
          <AppText variant="technical" style={styles.eyebrow}>
            {t('welcome.art.entries.label')}
          </AppText>
          <AppText variant="heading1" style={styles.totalValue}>
            {t('welcome.art.entries.total')}
          </AppText>
        </View>
        <View style={styles.months}>
          {months.map((month) => (
            <View key={month.key} style={styles.month}>
              <View style={[styles.bar, { height: month.height, backgroundColor: month.color }]} />
              <AppText variant="technical" style={styles.eyebrow}>
                {month.label}
              </AppText>
              <AppText variant="heading1" style={styles.monthValue}>
                {month.amount}
              </AppText>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.entries}>
        {entries.map((entry) => (
          <View key={entry.place} style={[styles.entry, entry.indented && styles.entryIndented]}>
            <View style={styles.entryIdentity}>
              <AppText variant="heading1" style={styles.entryPlace}>
                {entry.place}
              </AppText>
              <AppText variant="technical" style={styles.entryDate}>
                {entry.date}
              </AppText>
            </View>
            <AppText variant="heading1" style={styles.entryAmount}>
              {entry.amount}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  art: { gap: 12 },
  card: {
    backgroundColor: colors.darkBackground,
    borderRadius: m.cardRadius,
    padding: m.cardPadding,
    gap: 22,
  },
  total: { gap: 6 },
  eyebrow: { fontSize: 10, lineHeight: 14, letterSpacing: 1.8, color: palette.sage },
  totalValue: { fontSize: 40, lineHeight: 42, letterSpacing: -1.2, color: colors.darkTextPrimary },
  months: { flexDirection: 'row', gap: 10, alignItems: 'flex-end' },
  month: { flex: 1, gap: 8 },
  bar: { borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  monthValue: { fontSize: 14, lineHeight: 18, letterSpacing: 0, color: colors.darkTextPrimary },
  entries: { gap: 10 },
  entry: {
    borderWidth: 1,
    borderColor: colors.workCardBorder,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryIndented: { marginLeft: 28 },
  entryIdentity: { gap: 2, flexShrink: 1 },
  entryPlace: { fontSize: 15, lineHeight: 19, letterSpacing: 0, color: colors.textPrimary },
  entryDate: { fontSize: 11, lineHeight: 15, letterSpacing: 0.88, color: palette.sage },
  entryAmount: { fontSize: 17, lineHeight: 21, letterSpacing: 0, color: colors.textPrimary },
});
