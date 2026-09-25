import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { colors, onboardingIntroMetrics as m, palette, workLocationColors } from '@/theme/tokens';

const WEEKDAYS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];
const DAYS = [8, 9, 10, 11, 12, 13, 14];
const WITH_WORK = [10, 14];
const SELECTED = 12;

/** Exemplo ilustrativo do slide 01: calendário da semana e card de plantão. */
export function WorkSlideArt() {
  return (
    <View style={styles.art}>
      <View style={styles.calendar}>
        <View style={styles.calendarHeader}>
          <AppText variant="technical" style={styles.eyebrow}>
            {'SETEMBRO'}
          </AppText>
          <AppText variant="technical" style={styles.eyebrow}>
            {'SEM 37'}
          </AppText>
        </View>
        <View style={styles.week}>
          {WEEKDAYS.map((letter, index) => (
            <AppText
              // Cabeçalho posicional de sete colunas fixas.
              // biome-ignore lint/suspicious/noArrayIndexKey: coluna da grade, não item de lista.
              key={`${letter}-${index}`}
              variant="technical"
              style={[styles.eyebrow, styles.weekday]}
            >
              {letter}
            </AppText>
          ))}
        </View>
        <View style={styles.week}>
          {DAYS.map((day) => (
            <View key={day} style={[styles.day, day === SELECTED && styles.daySelected]}>
              <AppText style={[styles.dayNumber, day === SELECTED && styles.dayNumberSelected]}>
                {day}
              </AppText>
              {WITH_WORK.includes(day) && <View style={styles.dot} />}
            </View>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.cardIdentity}>
            <AppText variant="technical" style={styles.eyebrow}>
              {'12 SEX · PLANTÃO'}
            </AppText>
            <AppText variant="heading1" style={styles.place}>
              {'Hospital São Lucas'}
            </AppText>
            <AppText style={styles.hours}>{'19:00 — 07:00'}</AppText>
          </View>
          <AppText variant="heading1" style={styles.amount}>
            {'R$ 1.200'}
          </AppText>
        </View>
        <View style={styles.divider} />
        <View style={styles.cardFooter}>
          <AppText style={styles.footerLabel}>{'Entrada'}</AppText>
          <AppText variant="technical" style={styles.footerValue}>
            {'12 OUT'}
          </AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  art: { gap: 14 },
  calendar: { gap: 14, opacity: 0.9 },
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  eyebrow: { fontSize: 10, lineHeight: 14, letterSpacing: 1.8, color: palette.sage },
  week: { flexDirection: 'row', gap: 6 },
  weekday: { flex: 1, textAlign: 'center', letterSpacing: 0 },
  day: { flex: 1, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  daySelected: { backgroundColor: colors.foreground },
  dayNumber: { fontSize: 14, lineHeight: 18, color: colors.textMuted },
  dayNumberSelected: { color: colors.darkTextPrimary, fontWeight: '600' },
  dot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: workLocationColors.sage,
  },
  card: {
    backgroundColor: colors.darkBackground,
    borderRadius: m.cardRadius,
    paddingHorizontal: m.cardPadding,
    paddingTop: m.cardPadding,
    paddingBottom: 20,
    gap: 18,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardIdentity: { gap: 4, flexShrink: 1 },
  place: { fontSize: 18, lineHeight: 22, letterSpacing: -0.18, color: colors.darkTextPrimary },
  hours: { fontSize: 14, lineHeight: 18, color: colors.darkTextSecondary },
  amount: { fontSize: 24, lineHeight: 26, letterSpacing: -0.48, color: colors.darkTextPrimary },
  divider: { height: 1, backgroundColor: colors.darkBorder },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerLabel: { fontSize: 13, lineHeight: 17, color: colors.darkTextSecondary },
  footerValue: { fontSize: 12, lineHeight: 16, letterSpacing: 0.96, color: colors.accent },
});
