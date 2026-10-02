import DateTimePicker from '@react-native-community/datetimepicker';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { BottomSheet } from '@/components/BottomSheet';
import { formatDayMonth, type LocalDate } from '@/domain/calendar';
import { deviceTimezone } from '@/features/onboarding/profile-data';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { colors, palette } from '@/theme/tokens';
import type { ExpectedEntry } from '../work-draft';
import {
  addDaysToLocalDate,
  dateToLocalDate,
  localDateToDate,
  PAYMENT_TERMS,
  todayInTimezone,
} from '../work-schedule';
import { DarkButton, SheetHeading } from './FormPieces';
import { ReceivedChoice } from './ReceivedChoice';

type Choice =
  | { kind: 'term'; days: (typeof PAYMENT_TERMS)[number] }
  | { kind: 'date'; date: LocalDate }
  | { kind: 'unknown' };

/** Reconhece um prazo D30/D60/D90 a partir da data gravada no rascunho. */
export function expectedChoice(expected: ExpectedEntry | null, workDate: LocalDate): Choice | null {
  if (expected === null) return null;
  if (expected.kind === 'unknown') return expected;
  const days = PAYMENT_TERMS.find((term) => addDaysToLocalDate(workDate, term) === expected.date);
  return days === undefined ? { kind: 'date', date: expected.date } : { kind: 'term', days };
}

function choiceDate(choice: Choice, workDate: LocalDate): LocalDate | null {
  if (choice.kind === 'term') return addDaysToLocalDate(workDate, choice.days);
  return choice.kind === 'date' ? choice.date : null;
}

/**
 * Agenda 10: linguagem natural, com a data calculada ao lado de cada prazo. O cálculo parte
 * da data do trabalho. `Ainda não sei` é um estado válido: o valor entra sem data em Finanças.
 */
export function PaymentSheet({
  open,
  workDate,
  value,
  onClose,
  onConfirm,
}: {
  open: boolean;
  workDate: LocalDate;
  value: ExpectedEntry | null;
  onClose: () => void;
  onConfirm: (expected: ExpectedEntry) => void;
}) {
  const { t } = useTranslation('agenda');
  const type = useBrandTypography();
  const [choice, setChoice] = useState<Choice>({ kind: 'term', days: 30 });
  const [received, setReceived] = useState(false);
  const [today] = useState(() => todayInTimezone(deviceTimezone()));

  useEffect(() => {
    if (!open) return;
    setChoice(expectedChoice(value, workDate) ?? { kind: 'term', days: 30 });
    setReceived(value?.kind === 'date' && value.received === true);
  }, [open, value, workDate]);

  const picking = choice.kind === 'date';
  const date = choiceDate(choice, workDate);
  // "Já recebi" (7.7) só existe para data de hoje ou já passada.
  const past = date !== null && date <= today;
  const markReceived = past && received;
  const pastLabel = (day: LocalDate) =>
    day <= today ? `${formatDayMonth(day)} · ${t('form.paymentSheet.past')}` : formatDayMonth(day);

  function option(
    key: string,
    label: string,
    selected: boolean,
    onPress: () => void,
    trailing?: string,
  ) {
    return (
      <Pressable
        key={key}
        accessibilityRole="radio"
        accessibilityLabel={trailing ? `${label}, ${trailing}` : label}
        accessibilityState={{ checked: selected }}
        onPress={onPress}
        testID={`work-payment-${key}`}
        style={({ pressed }) => [
          styles.option,
          selected ? styles.optionOn : styles.optionOff,
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.optionIdentity}>
          <View style={[styles.radio, selected ? styles.radioOn : styles.radioOff]}>
            {selected && <View style={styles.radioDot} />}
          </View>
          <AppText style={[selected && type.heading1, styles.optionLabel]}>{label}</AppText>
        </View>
        {trailing ? (
          <AppText variant="technical" style={[styles.optionDate, selected && styles.optionDateOn]}>
            {trailing}
          </AppText>
        ) : null}
      </Pressable>
    );
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      accessibilityLabel={t('form.paymentSheet.title')}
      testID="work-payment-sheet"
    >
      <SheetHeading
        eyebrow={t('form.paymentSheet.eyebrow')}
        title={t('form.paymentSheet.title')}
        description={t('form.paymentSheet.from', { date: formatDayMonth(workDate) })}
      />
      <View accessibilityRole="radiogroup" style={styles.options}>
        {option(
          'date',
          t('form.paymentSheet.specific'),
          picking,
          () =>
            setChoice(
              picking
                ? { kind: 'term', days: 30 }
                : { kind: 'date', date: date ?? addDaysToLocalDate(workDate, 30) },
            ),
          picking && date ? pastLabel(date) : undefined,
        )}
        {picking && Platform.OS === 'ios' && date ? (
          // Com a data específica aberta, o calendário da Apple ocupa o lugar dos prazos.
          <DateTimePicker
            accessibilityLabel={t('form.paymentSheet.specific')}
            accentColor={palette.bronze}
            display="inline"
            locale="pt-BR"
            minimumDate={localDateToDate(workDate)}
            mode="date"
            onValueChange={(_event, picked) => {
              if (picked) setChoice({ kind: 'date', date: dateToLocalDate(picked) });
            }}
            testID="work-payment-picker"
            themeVariant="light"
            value={localDateToDate(date)}
          />
        ) : (
          <>
            {PAYMENT_TERMS.map((days) =>
              option(
                String(days),
                t('form.paymentSheet.inDays', { days }),
                choice.kind === 'term' && choice.days === days,
                () => setChoice({ kind: 'term', days }),
                pastLabel(addDaysToLocalDate(workDate, days)),
              ),
            )}
            {option('unknown', t('form.paymentSheet.unknown'), choice.kind === 'unknown', () =>
              setChoice({ kind: 'unknown' }),
            )}
          </>
        )}
      </View>
      {picking && Platform.OS !== 'ios' && date && (
        <DateTimePicker
          minimumDate={localDateToDate(workDate)}
          mode="date"
          onValueChange={(_event, picked) => {
            if (picked) setChoice({ kind: 'date', date: dateToLocalDate(picked) });
          }}
          value={localDateToDate(date)}
        />
      )}
      {choice.kind === 'unknown' && (
        <AppText style={styles.note}>{t('form.paymentSheet.unknownNote')}</AppText>
      )}
      {past && date !== null && (
        <ReceivedChoice date={date} received={received} onChange={setReceived} />
      )}
      <DarkButton
        label={
          date === null
            ? t('form.paymentSheet.confirmUnknown')
            : t(
                markReceived
                  ? 'form.paymentSheet.confirmReceived'
                  : 'form.paymentSheet.confirmDate',
                {
                  date: formatDayMonth(date),
                },
              )
        }
        onPress={() =>
          onConfirm(
            date === null
              ? { kind: 'unknown' }
              : markReceived
                ? { kind: 'date', date, received: true }
                : { kind: 'date', date },
          )
        }
        testID="work-payment-confirm"
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  options: { gap: 8 },
  option: {
    minHeight: 56,
    borderRadius: 16,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  optionOn: { borderColor: colors.foreground, backgroundColor: '#F6F4EC' },
  optionOff: { borderColor: 'rgba(16,22,15,0.2)' },
  optionIdentity: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { borderColor: colors.foreground },
  radioOff: { borderColor: 'rgba(16,22,15,0.3)' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.foreground },
  optionLabel: { fontSize: 16, lineHeight: 20, letterSpacing: 0, color: colors.textPrimary },
  optionDate: { fontSize: 11, lineHeight: 15, letterSpacing: 1.32, color: palette.sage },
  optionDateOn: { color: colors.textPrimary },
  note: { fontSize: 13, lineHeight: 18, color: palette.mutedCopy },
  pressed: { opacity: 0.72 },
});
