import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { colors, onboardingIntroMetrics as m, palette } from '@/theme/tokens';

const MONTHS = [
  { label: 'SET', height: 46, color: palette.workSage, amount: 'R$ 3.200' },
  { label: 'OUT', height: 60, color: palette.bronze, amount: 'R$ 4.050' },
  { label: 'NOV', height: 18, color: palette.structure, amount: 'R$ 1.200' },
] as const;

const ENTRIES = [
  { place: 'Hospital São Lucas', date: '18 OUT', amount: 'R$ 1.200', indented: false },
  { place: 'Clínica Central', date: '05 OUT', amount: 'R$ 850', indented: true },
] as const;

/** Exemplo ilustrativo do slide 02: total a receber, distribuição e próximas entradas. */
export function EntriesSlideArt() {
  return (
    <View style={styles.art}>
      <View style={styles.card}>
        <View style={styles.total}>
          <AppText variant="technical" style={styles.eyebrow}>
            {'A RECEBER'}
          </AppText>
          <AppText variant="heading1" style={styles.totalValue}>
            {'R$ 8.450'}
          </AppText>
        </View>
        <View style={styles.months}>
          {MONTHS.map((month) => (
            <View key={month.label} style={styles.month}>
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
        {ENTRIES.map((entry) => (
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
