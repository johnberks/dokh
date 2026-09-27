import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { BottomSheet } from '@/components/BottomSheet';
import { EmptyState } from '@/components/EmptyState';
import { MoneyInput } from '@/components/MoneyInput';
import { PeriodSwitcher } from '@/components/PeriodSwitcher';
import { LoadError, MutationError } from '@/components/TechnicalStates';
import { formatCentsToBRL, parseBRLToCents } from '@/domain/money';
import { deviceTimezone } from '@/features/onboarding/profile-data';
import { DarkButton, FieldBox, SheetHeading } from '@/features/work/form/FormPieces';
import { todayInTimezone } from '@/features/work/work-schedule';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { colors, palette } from '@/theme/tokens';
import { Note, SubScreen, TextField } from './ProfilePieces';
import {
  type Residency,
  useActiveResidency,
  useEndResidency,
  useProfile,
  useSaveResidency,
} from './profile-data';

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const DAYS = Array.from({ length: 31 }, (_, index) => index + 1);

/** `2025-03-01` → `Mar 2025`. */
export function monthYearLabel(date: string): string {
  return `${MONTHS[Number(date.slice(5, 7)) - 1]} ${date.slice(0, 4)}`;
}

function currentMonthStart(): string {
  return `${todayInTimezone(deviceTimezone()).slice(0, 7)}-01`;
}

function Line({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  const type = useBrandTypography();
  return (
    <View style={[styles.line, !last && styles.lineRule]}>
      <AppText style={styles.lineLabel}>{label}</AppText>
      <AppText numberOfLines={1} style={[type.heading1, styles.lineValue]}>
        {value}
      </AppText>
    </View>
  );
}

/**
 * Perfil 05 (residência ativa: nível, programa, instituição, início, término, bolsa e dia) e
 * 05b (vazio neutro, sem presumir residência). A bolsa vira fonte recorrente em Finanças (3.9).
 */
export function ResidencyScreen() {
  const { t } = useTranslation('profile');
  const type = useBrandTypography();
  const residency = useActiveResidency();
  const data = residency.data;
  const openForm = () => router.push('/profile/residency/edit');

  return (
    <SubScreen title={t('residency.title')} onBack={() => router.back()} testID="residency-screen">
      {residency.isPending ? (
        <ActivityIndicator color={palette.sage} style={styles.loading} />
      ) : residency.isError ? (
        <LoadError onRetry={() => void residency.refetch()} retrying={residency.isFetching} />
      ) : !data ? (
        <View style={styles.empty}>
          <EmptyState
            variant="profileResidency"
            onPrimaryPress={openForm}
            testID="residency-empty"
          />
        </View>
      ) : (
        <View style={styles.block}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${t('residency.active')}, ${data.specialty}`}
            onPress={openForm}
            testID="residency-card"
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          >
            <View style={styles.accent} />
            <View style={styles.cardTop}>
              <View style={styles.cardTopStart}>
                <AppText variant="technical" style={styles.eyebrow}>
                  {t('residency.active')}
                </AppText>
                {data.levelLabel ? (
                  <View style={styles.levelTag}>
                    <AppText style={[type.heading1, styles.levelText]}>{data.levelLabel}</AppText>
                  </View>
                ) : null}
              </View>
              <View style={styles.arrow}>
                <AppText style={[type.heading1, styles.arrowText]}>{'→'}</AppText>
              </View>
            </View>
            <AppText style={[type.heading1, styles.program]}>{data.specialty}</AppText>
            <Line
              label={t('residency.institution')}
              value={data.institution ?? t('residency.notInformed')}
            />
            <Line label={t('residency.start')} value={monthYearLabel(data.startsOn)} />
            <Line
              label={t('residency.end')}
              value={
                data.expectedEndsOn
                  ? monthYearLabel(data.expectedEndsOn)
                  : t('residency.notInformed')
              }
            />
            <Line label={t('residency.amount')} value={formatCentsToBRL(data.monthlyAmountCents)} />
            <Line
              label={t('residency.paymentDay')}
              value={t('residency.paymentDayValue', {
                day: String(data.paymentDay).padStart(2, '0'),
              })}
              last
            />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('residency.edit')}
            onPress={openForm}
            testID="residency-edit"
            style={({ pressed }) => [styles.outline, pressed && styles.pressed]}
          >
            <AppText style={[type.heading1, styles.outlineText]}>{t('residency.edit')}</AppText>
          </Pressable>
          <Note>{t('residency.note')}</Note>
        </View>
      )}
    </SubScreen>
  );
}

function MonthSheet({
  open,
  title,
  value,
  allowClear,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  value: string;
  allowClear?: boolean;
  onClose: () => void;
  onConfirm: (month: string | null) => void;
}) {
  const { t } = useTranslation('profile');
  const type = useBrandTypography();
  const [year, setYear] = useState(Number(value.slice(0, 4)));
  const [month, setMonth] = useState(Number(value.slice(5, 7)));

  useEffect(() => {
    if (!open) return;
    setYear(Number(value.slice(0, 4)));
    setMonth(Number(value.slice(5, 7)));
  }, [open, value]);

  const chosen = `${year}-${String(month).padStart(2, '0')}-01`;
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      accessibilityLabel={title}
      testID="residency-month-sheet"
    >
      <SheetHeading eyebrow={title} title={monthYearLabel(chosen)} />
      <PeriodSwitcher
        size="compact"
        title={String(year)}
        previousLabel={t('residency.previousMonth')}
        nextLabel={t('residency.nextMonth')}
        onPrevious={() => setYear(year - 1)}
        onNext={() => setYear(year + 1)}
        testID="residency-month-year"
      />
      <View accessibilityRole="radiogroup" style={styles.monthGrid}>
        {MONTHS.map((label, index) => {
          const on = index + 1 === month;
          return (
            <Pressable
              key={label}
              accessibilityRole="radio"
              accessibilityLabel={`${label} ${year}`}
              accessibilityState={{ checked: on }}
              onPress={() => setMonth(index + 1)}
              testID={`residency-month-${index + 1}`}
              style={({ pressed }) => [
                styles.monthChip,
                on ? styles.chipOn : styles.chipOff,
                pressed && styles.pressed,
              ]}
            >
              <AppText style={[type.heading1, styles.chipText, on && styles.chipTextOn]}>
                {label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
      <DarkButton
        label={t('residency.confirmMonth', { month: monthYearLabel(chosen) })}
        onPress={() => onConfirm(chosen)}
        testID="residency-month-confirm"
      />
      {allowClear && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('residency.clearEnd')}
          onPress={() => onConfirm(null)}
          testID="residency-month-clear"
          style={({ pressed }) => [styles.textButton, pressed && styles.pressed]}
        >
          <AppText style={[type.heading1, styles.textButtonLabel]}>
            {t('residency.clearEnd')}
          </AppText>
        </Pressable>
      )}
    </BottomSheet>
  );
}

function DaySheet({
  open,
  value,
  onClose,
  onConfirm,
}: {
  open: boolean;
  value: number;
  onClose: () => void;
  onConfirm: (day: number) => void;
}) {
  const { t } = useTranslation('profile');
  const type = useBrandTypography();
  const [day, setDay] = useState(value);
  useEffect(() => {
    if (open) setDay(value);
  }, [open, value]);
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      accessibilityLabel={t('residency.dayField')}
      testID="residency-day-sheet"
    >
      <SheetHeading
        eyebrow={t('residency.dayField')}
        title={t('residency.dayValue', { day: String(day).padStart(2, '0') })}
      />
      <View accessibilityRole="radiogroup" style={styles.dayGrid}>
        {DAYS.map((option) => {
          const on = option === day;
          return (
            <Pressable
              key={option}
              accessibilityRole="radio"
              accessibilityLabel={String(option)}
              accessibilityState={{ checked: on }}
              onPress={() => setDay(option)}
              testID={`residency-day-${option}`}
              style={({ pressed }) => [
                styles.dayChip,
                on ? styles.chipOn : styles.chipOff,
                pressed && styles.pressed,
              ]}
            >
              <AppText style={[type.heading1, styles.chipText, on && styles.chipTextOn]}>
                {String(option).padStart(2, '0')}
              </AppText>
            </Pressable>
          );
        })}
      </View>
      <DarkButton
        label={t('residency.confirmDay', { day: String(day).padStart(2, '0') })}
        onPress={() => onConfirm(day)}
        testID="residency-day-confirm"
      />
    </BottomSheet>
  );
}

/**
 * Formulário da residência (sem tela própria no HTML; segue os campos do Perfil 05 com os
 * componentes de formulário da Agenda). Salvar usa a RPC Free da 3.9; `Encerrar residência`
 * mantém o recebido e tira os meses futuros de Finanças.
 */
export function ResidencyFormScreen() {
  const { t } = useTranslation('profile');
  const residency = useActiveResidency();
  const profile = useProfile();
  if (residency.isPending || profile.isPending) {
    return (
      <SubScreen title={t('residency.formNew')} onBack={() => router.back()}>
        <ActivityIndicator color={palette.sage} style={styles.loading} />
      </SubScreen>
    );
  }
  if (residency.isError) {
    return (
      <SubScreen title={t('residency.formNew')} onBack={() => router.back()}>
        <LoadError onRetry={() => void residency.refetch()} retrying={residency.isFetching} />
      </SubScreen>
    );
  }
  return (
    <ResidencyForm
      current={residency.data ?? null}
      suggestedProgram={profile.data?.status === 'resident' ? (profile.data.specialty ?? '') : ''}
    />
  );
}

function ResidencyForm({
  current,
  suggestedProgram,
}: {
  current: Residency | null;
  suggestedProgram: string;
}) {
  const { t } = useTranslation('profile');
  const type = useBrandTypography();
  const save = useSaveResidency();
  const end = useEndResidency();
  const [program, setProgram] = useState(current?.specialty ?? suggestedProgram);
  const [level, setLevel] = useState(current?.levelLabel ?? '');
  const [institution, setInstitution] = useState(current?.institution ?? '');
  const [startsOn, setStartsOn] = useState(current?.startsOn ?? currentMonthStart());
  const [endsOn, setEndsOn] = useState<string | null>(current?.expectedEndsOn ?? null);
  const [amount, setAmount] = useState(
    current ? formatCentsToBRL(current.monthlyAmountCents).replace(/^R\$\s*/u, '') : '',
  );
  const [day, setDay] = useState(current?.paymentDay ?? 5);
  const [sheet, setSheet] = useState<'start' | 'end' | 'day' | null>(null);
  const [confirmingEnd, setConfirmingEnd] = useState(false);
  const cents = parseBRLToCents(amount);
  const endBeforeStart = endsOn !== null && endsOn.slice(0, 7) < startsOn.slice(0, 7);
  const ready = program.trim() !== '' && cents !== null && !endBeforeStart;

  function submit() {
    if (!ready || cents === null) return;
    save.mutate(
      {
        id: current?.id ?? null,
        input: {
          specialty: program,
          levelLabel: level || null,
          institution: institution || null,
          startsOn,
          expectedEndsOn: endsOn,
          monthlyAmountCents: cents,
          paymentDay: day,
        },
      },
      { onSuccess: () => router.back() },
    );
  }

  function confirmEnd() {
    if (!current) return;
    end.mutate(current.id, {
      onSuccess: () => {
        setConfirmingEnd(false);
        router.back();
      },
    });
  }

  return (
    <SubScreen
      title={current ? t('residency.formEdit') : t('residency.formNew')}
      onBack={() => router.back()}
      testID="residency-form"
      footer={
        <>
          <DarkButton
            label={current ? t('residency.saveChanges') : t('residency.save')}
            disabled={!ready}
            loading={save.isPending}
            onPress={submit}
            testID="residency-save"
          />
          {current && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('residency.endResidency')}
              onPress={() => setConfirmingEnd(true)}
              testID="residency-end"
              style={({ pressed }) => [styles.textButton, pressed && styles.pressed]}
            >
              <AppText style={styles.discreet}>{t('residency.endResidency')}</AppText>
            </Pressable>
          )}
        </>
      }
    >
      <View style={styles.fields}>
        <TextField
          label={t('residency.program')}
          value={program}
          onChangeText={setProgram}
          placeholder={t('residency.programPlaceholder')}
          autoCapitalize="words"
          testID="residency-program"
        />
        <View style={styles.row}>
          <View style={styles.flex}>
            <TextField
              label={t('residency.level')}
              value={level}
              onChangeText={setLevel}
              placeholder={t('residency.levelPlaceholder')}
              autoCapitalize="characters"
              maxLength={12}
              testID="residency-level"
            />
          </View>
          <View style={styles.flex}>
            <FieldBox
              label={t('residency.startField')}
              value={monthYearLabel(startsOn)}
              placeholder=""
              onPress={() => setSheet('start')}
              testID="residency-start"
            />
          </View>
        </View>
        <TextField
          label={t('residency.institutionField')}
          value={institution}
          onChangeText={setInstitution}
          placeholder={t('residency.institutionPlaceholder')}
          autoCapitalize="words"
          testID="residency-institution"
        />
        <FieldBox
          label={t('residency.endField')}
          value={endsOn ? monthYearLabel(endsOn) : null}
          placeholder={t('residency.endNone')}
          onPress={() => setSheet('end')}
          accessory={<AppText style={styles.chevron}>{'›'}</AppText>}
          testID="residency-end-field"
        />
        <View style={styles.amount}>
          <MoneyInput
            label={t('residency.amountField')}
            value={amount}
            onChangeText={setAmount}
            testID="residency-amount"
          />
        </View>
        <FieldBox
          label={t('residency.dayField')}
          value={t('residency.dayValue', { day: String(day).padStart(2, '0') })}
          placeholder=""
          onPress={() => setSheet('day')}
          accessory={<AppText style={styles.chevron}>{'›'}</AppText>}
          testID="residency-day"
        />
        <View style={styles.formNote}>
          <Note>{t('residency.formNote')}</Note>
        </View>
      </View>
      {save.isError && <MutationError onRetry={submit} retrying={save.isPending} />}

      <MonthSheet
        open={sheet === 'start' || sheet === 'end'}
        title={sheet === 'end' ? t('residency.endField') : t('residency.startField')}
        value={sheet === 'end' ? (endsOn ?? startsOn) : startsOn}
        allowClear={sheet === 'end'}
        onClose={() => setSheet(null)}
        onConfirm={(month) => {
          if (sheet === 'end') setEndsOn(month);
          else if (month) setStartsOn(month);
          setSheet(null);
        }}
      />
      <DaySheet
        open={sheet === 'day'}
        value={day}
        onClose={() => setSheet(null)}
        onConfirm={(value) => {
          setDay(value);
          setSheet(null);
        }}
      />
      <BottomSheet
        open={confirmingEnd}
        onClose={() => {
          if (!end.isPending) setConfirmingEnd(false);
        }}
        accessibilityLabel={t('residency.endTitle')}
        testID="residency-end-sheet"
      >
        <View style={styles.sheetCopy}>
          <AppText accessibilityRole="header" style={[type.heading1, styles.sheetTitle]}>
            {t('residency.endTitle')}
          </AppText>
          <AppText style={styles.sheetText}>{t('residency.endText')}</AppText>
        </View>
        {end.isError && <MutationError onRetry={confirmEnd} retrying={end.isPending} />}
        <DarkButton
          label={t('residency.endConfirm')}
          loading={end.isPending}
          onPress={confirmEnd}
          testID="residency-end-confirm"
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('residency.cancel')}
          disabled={end.isPending}
          onPress={() => setConfirmingEnd(false)}
          style={({ pressed }) => [styles.textButton, pressed && styles.pressed]}
        >
          <AppText style={[type.heading1, styles.textButtonLabel]}>{t('residency.cancel')}</AppText>
        </Pressable>
      </BottomSheet>
    </SubScreen>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: 32 },
  flex: { flex: 1 },
  empty: { flex: 1, justifyContent: 'center', paddingBottom: 80 },
  block: { gap: 16 },
  card: {
    overflow: 'hidden',
    backgroundColor: palette.paper,
    borderWidth: 1,
    borderColor: 'rgba(16,22,15,0.16)',
    borderRadius: 22,
    paddingTop: 18,
    paddingHorizontal: 20,
    paddingBottom: 6,
    shadowColor: palette.base,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 2,
  },
  cardPressed: { transform: [{ translateY: 1 }], backgroundColor: '#F3F0E7' },
  accent: {
    position: 'absolute',
    left: 0,
    top: 18,
    bottom: 18,
    width: 4,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: palette.workSage,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  cardTopStart: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyebrow: { fontSize: 10, lineHeight: 14, letterSpacing: 1.8, color: palette.sage },
  levelTag: {
    backgroundColor: 'rgba(43,58,36,0.10)',
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 9,
  },
  levelText: { fontSize: 11, lineHeight: 14, letterSpacing: 0, color: palette.structure },
  arrow: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.foreground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: { fontSize: 14, lineHeight: 16, letterSpacing: 0, color: palette.bronze },
  program: {
    fontSize: 22,
    lineHeight: 25,
    letterSpacing: -0.44,
    color: colors.textPrimary,
    paddingBottom: 6,
  },
  line: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 12,
    paddingVertical: 14,
  },
  lineRule: { borderBottomWidth: 1, borderBottomColor: 'rgba(16,22,15,0.08)' },
  lineLabel: { fontSize: 14, lineHeight: 18, color: palette.mutedCopy },
  lineValue: {
    flexShrink: 1,
    fontSize: 15,
    lineHeight: 19,
    letterSpacing: 0,
    color: colors.textPrimary,
    textAlign: 'right',
  },
  outline: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.foreground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineText: { fontSize: 15, lineHeight: 19, letterSpacing: 0, color: colors.textPrimary },
  fields: { gap: 10 },
  row: { flexDirection: 'row', gap: 10 },
  amount: { paddingTop: 6 },
  formNote: { paddingTop: 6 },
  chevron: { fontSize: 18, lineHeight: 22, color: palette.sage },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  monthChip: {
    width: '23%',
    flexGrow: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  dayChip: {
    width: '12.5%',
    flexGrow: 1,
    minHeight: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipOn: { borderColor: colors.foreground, backgroundColor: colors.foreground },
  chipOff: { borderColor: 'rgba(16,22,15,0.2)' },
  chipText: { fontSize: 14, lineHeight: 18, letterSpacing: 0, color: colors.textPrimary },
  chipTextOn: { color: palette.cream },
  textButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  textButtonLabel: { fontSize: 15, lineHeight: 19, letterSpacing: 0, color: colors.textPrimary },
  discreet: { fontSize: 14, lineHeight: 18, color: palette.mutedCopy },
  sheetCopy: { gap: 8, paddingTop: 6 },
  sheetTitle: { fontSize: 22, lineHeight: 26, letterSpacing: -0.44, color: colors.textPrimary },
  sheetText: { fontSize: 15, lineHeight: 22, color: palette.mutedCopy },
  pressed: { opacity: 0.72 },
});
