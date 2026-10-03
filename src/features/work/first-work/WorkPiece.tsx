import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';
import { AppText } from '@/components/AppText';
import { formatDayMonth } from '@/domain/calendar';
import { formatCentsToBRL, parseBRLToCents } from '@/domain/money';
import type { WorkType } from '@/domain/work-type';
import { formatDuration } from '@/features/onboarding/onboarding-summary';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { motion, palette } from '@/theme/tokens';
import { useReducedMotion } from '@/theme/useReducedMotion';
import type { ExpectedEntry } from '../work-draft';

export type WorkPieceValues = {
  type: WorkType | null;
  locationName: string;
  workDate: string | null;
  startTime: string | null;
  durationMinutes: number | null;
  /** Texto pt-BR do rascunho; vira valor só quando for válido. */
  amount: string;
  expected: ExpectedEntry | null;
};

export const EMPTY_PIECE: WorkPieceValues = {
  type: null,
  locationName: '',
  workDate: null,
  startTime: null,
  durationMinutes: null,
  amount: '',
  expected: null,
};

/**
 * A peça (Onboarding v2, 7.7): o trabalho se montando enquanto é cadastrado. Cada resposta
 * preenche um encaixe — tipo, local, data, valor e entrada — e o que falta aparece como espaço
 * tracejado. Fica fixa no topo das etapas, então nada do que já foi dito some da tela.
 * `dark` sobre o fundo creme das etapas; `light` sobre o fundo escuro da ponte.
 */
export function WorkPiece({
  values,
  today,
  tone = 'dark',
  testID = 'work-piece',
}: {
  values: WorkPieceValues;
  today: string;
  tone?: 'dark' | 'light';
  testID?: string;
}) {
  const { t } = useTranslation('onboarding');
  const type = useBrandTypography();
  const reduced = useReducedMotion();
  const dark = tone === 'dark';
  const enter = reduced ? undefined : FadeIn.duration(motion.enter);
  const layout = reduced ? undefined : LinearTransition.duration(motion.enter);

  const place = values.locationName.trim();
  const cents = parseBRLToCents(values.amount);
  const dateLine =
    values.workDate === null
      ? null
      : [
          formatDayMonth(values.workDate),
          values.startTime,
          values.durationMinutes === null ? null : formatDuration(values.durationMinutes),
        ]
          .filter((part): part is string => part !== null)
          .join(' · ');
  const entry = entryLine(values.expected, today, t);

  const ink = dark ? palette.cream : palette.base;
  const muted = dark ? palette.secondaryText : palette.mutedCopy;

  return (
    <Animated.View
      layout={layout}
      accessible
      accessibilityLabel={[
        t('firstWork.piece.label'),
        values.type ? t(`firstWork.chip.${values.type}`) : null,
        place || null,
        dateLine,
        cents === null ? null : formatCentsToBRL(cents),
        entry?.text ?? null,
      ]
        .filter(Boolean)
        .join(', ')}
      style={[styles.piece, dark ? styles.pieceDark : styles.pieceLight]}
      testID={testID}
    >
      <View style={styles.row}>
        {values.type ? (
          <Animated.View key={values.type} entering={enter} style={styles.chip}>
            <AppText variant="technical" style={styles.chipText} testID={`${testID}-type`}>
              {t(`firstWork.chip.${values.type}`)}
            </AppText>
          </Animated.View>
        ) : (
          <Slot label={t('firstWork.piece.slotType')} dark={dark} />
        )}
        {cents !== null ? (
          <Animated.View entering={enter}>
            <AppText
              style={[type.heading1, styles.amount, { color: ink }]}
              testID={`${testID}-amount`}
            >
              {formatCentsToBRL(cents, { omitZeroCents: true })}
            </AppText>
          </Animated.View>
        ) : (
          <Slot label={t('firstWork.piece.slotAmount')} dark={dark} />
        )}
      </View>

      {place ? (
        <AppText
          numberOfLines={1}
          style={[type.heading1, styles.place, { color: ink }]}
          testID={`${testID}-place`}
        >
          {place}
        </AppText>
      ) : (
        <View style={styles.slotRow}>
          <Slot label={t('firstWork.piece.slotPlace')} dark={dark} />
        </View>
      )}

      {dateLine ? (
        <Animated.View entering={enter}>
          <AppText style={[styles.date, { color: muted }]} testID={`${testID}-date`}>
            {dateLine}
          </AppText>
        </Animated.View>
      ) : (
        <View style={styles.slotRow}>
          <Slot label={t('firstWork.piece.slotDate')} dark={dark} />
        </View>
      )}

      {entry ? (
        <Animated.View
          key={entry.text}
          entering={enter}
          style={[styles.entry, entry.settled ? styles.entrySettled : styles.entryOpen]}
          testID={`${testID}-entry`}
        >
          <View style={[styles.entryDot, !entry.settled && styles.entryDotOpen]} />
          <AppText style={[type.heading1, styles.entryText, !entry.settled && { color: ink }]}>
            {entry.text}
          </AppText>
        </Animated.View>
      ) : (
        <View style={[styles.entry, styles.entryEmpty, dark ? styles.slotDark : styles.slotLight]}>
          <AppText style={[styles.slotText, { color: dark ? palette.sage : palette.mutedCopy }]}>
            {t('firstWork.piece.slotEntry')}
          </AppText>
        </View>
      )}
    </Animated.View>
  );
}

/** Linha da entrada: prevista (bronze), recebida, aguardando confirmação ou a definir. */
function entryLine(
  expected: ExpectedEntry | null,
  today: string,
  t: TFunction<'onboarding'>,
): { text: string; settled: boolean } | null {
  if (expected === null) return null;
  if (expected.kind === 'unknown') return { text: t('firstWork.piece.undated'), settled: false };
  const date = formatDayMonth(expected.date);
  if (expected.date > today)
    return { text: t('firstWork.piece.expected', { date }), settled: true };
  return expected.received
    ? { text: t('firstWork.piece.received', { date }), settled: true }
    : { text: t('firstWork.piece.pending', { date }), settled: false };
}

/** Espaço ainda vazio da peça: tracejado, com o nome do que falta. */
function Slot({ label, dark }: { label: string; dark: boolean }) {
  return (
    <View style={[styles.slot, dark ? styles.slotDark : styles.slotLight]}>
      <AppText style={[styles.slotText, { color: dark ? palette.sage : palette.mutedCopy }]}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  piece: { borderRadius: 18, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12, gap: 6 },
  pieceDark: { backgroundColor: palette.base },
  pieceLight: { backgroundColor: palette.cream },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  chip: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: palette.bronze,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  chipText: { fontSize: 10, lineHeight: 13, letterSpacing: 1.2, color: palette.base },
  amount: { fontSize: 18, lineHeight: 22, letterSpacing: -0.36 },
  place: { fontSize: 17, lineHeight: 21, letterSpacing: -0.17 },
  date: { fontSize: 13, lineHeight: 17 },
  slotRow: { flexDirection: 'row' },
  slot: {
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  slotDark: { borderColor: 'rgba(237,234,224,0.28)' },
  slotLight: { borderColor: 'rgba(16,22,15,0.28)' },
  slotText: { fontSize: 12, lineHeight: 16 },
  entry: {
    marginTop: 4,
    minHeight: 30,
    borderRadius: 10,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  entrySettled: { backgroundColor: palette.bronze },
  entryOpen: { borderWidth: 1, borderColor: palette.bronze },
  entryEmpty: { borderWidth: 1, borderStyle: 'dashed', justifyContent: 'center' },
  entryDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: palette.base },
  entryDotOpen: { backgroundColor: palette.bronze },
  entryText: { fontSize: 13, lineHeight: 17, letterSpacing: 0, color: palette.base },
});
