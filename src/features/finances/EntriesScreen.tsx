import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { EmptyState } from '@/components/EmptyState';
import { TwoToneScrollScreen } from '@/components/Layout';
import { PeriodSwitcher } from '@/components/PeriodSwitcher';
import { ReceiptProgressCard } from '@/components/ReceiptProgressCard';
import { ReceivableRow } from '@/components/ReceivableRow';
import { LoadError, Skeleton } from '@/components/TechnicalStates';
import { formatDayMonth, type LocalMonth, shiftMonth } from '@/domain/calendar';
import { formatCentsToBRL } from '@/domain/money';
import { AgendaHeroBackdrop } from '@/features/agenda/AgendaHeroBackdrop';
import { deviceTimezone } from '@/features/onboarding/profile-data';
import { useConfirmReceivable } from '@/features/work/work-data';
import { localDateToDate, todayInTimezone } from '@/features/work/work-schedule';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { colors, palette } from '@/theme/tokens';
import { FinanceSubHero } from './FinanceSubHero';
import {
  type FinanceMonth,
  type MonthEntry,
  useFinanceMonth,
  useMonthEntries,
} from './finance-data';
import { type MonthTense, monthTense, receivedPercent, splitCaption } from './finance-format';

const MONTH_NAME = new Intl.DateTimeFormat('pt-BR', { month: 'long' });
const money = (cents: bigint) => formatCentsToBRL(cents, { omitZeroCents: true });

function monthName(month: LocalMonth): string {
  const name = MONTH_NAME.format(localDateToDate(`${month}-01`));
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/** Quanto o resumo sobe sobre o topo verde (mesmo efeito do calendário e de Finanças). */
const OVERLAP = 96;

/**
 * Entradas (Finanças 05–10 e 14): extrato cronológico do mês pela data prevista de pagamento.
 * Recebido, previsto e confirmação pendente são distintos; `Você recebeu?` só confirma pelo
 * servidor, sem estado otimista nem confirmação pela passagem do tempo. Sem data fica de fora.
 */
export function EntriesScreen({ initialMonth }: { initialMonth: LocalMonth }) {
  const { t } = useTranslation('finances');
  const [today] = useState(() => todayInTimezone(deviceTimezone()));
  const [month, setMonth] = useState<LocalMonth>(initialMonth);
  const summary = useFinanceMonth(month);
  const entries = useMonthEntries(month);
  const confirm = useConfirmReceivable();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [failedId, setFailedId] = useState<string | null>(null);
  const tense = monthTense(month, today);
  const name = monthName(month);
  const items = entries.data ?? [];
  const hasItems = items.length > 0 && summary.data !== undefined;

  function onConfirm(entry: MonthEntry) {
    setFailedId(null);
    setConfirmingId(entry.receivableId);
    confirm.mutate(entry.receivableId, {
      onError: () => setFailedId(entry.receivableId),
      onSettled: () => setConfirmingId(null),
    });
  }

  const hero = (
    <FinanceSubHero title={t('entries.title')} overlap={hasItems ? OVERLAP : 0} testID="entries">
      <PeriodSwitcher
        title={name}
        secondary={month.slice(0, 4)}
        previousLabel={t('previousMonth')}
        nextLabel={t('nextMonth')}
        onPrevious={() => setMonth(shiftMonth(month, -1))}
        onNext={() => setMonth(shiftMonth(month, 1))}
        testID="entries-month"
      />
    </FinanceSubHero>
  );

  return (
    <TwoToneScrollScreen
      heroBackground={<AgendaHeroBackdrop />}
      hero={hero}
      bodyStyle={styles.body}
      testID="entries-screen"
    >
      {entries.isPending || summary.isPending ? (
        <Skeleton layout="list" testID="entries-loading" />
      ) : entries.isError || summary.isError ? (
        // Falha de leitura nunca vira "nada previsto".
        <LoadError
          onRetry={() => {
            void entries.refetch();
            void summary.refetch();
          }}
          retrying={entries.isFetching || summary.isFetching}
          testID="entries-error"
        />
      ) : !hasItems ? (
        <EmptyState
          variant="entriesMonth"
          periodLabel={`${name} ${month.slice(0, 4)}`.toUpperCase()}
          testID="entries-empty"
        />
      ) : (
        <View style={styles.sections}>
          <View style={styles.overlap} testID="entries-summary-wrap">
            <EntriesSummary
              data={summary.data}
              tense={tense}
              count={items.length}
              pending={items.filter((item) => item.status === 'confirmation_pending').length}
              name={name}
            />
          </View>
          {failedId ? (
            <AppText accessibilityRole="alert" style={styles.error} testID="entries-confirm-error">
              {t('entries.confirmError')}
            </AppText>
          ) : null}
          <View testID="entries-list">
            {items.map((entry) => {
              const [day, mon] = formatDayMonth(entry.expectedOn).split(' ');
              const common = {
                day,
                month: mon,
                origin: entry.locationName ?? t('next.residency'),
                value: money(entry.amountCents),
                // A Residência não tem detalhe de Trabalho; o toque não leva a lugar nenhum.
                disabled: entry.workId === null,
                onPress: () => {
                  if (entry.workId) {
                    router.push({ pathname: '/work/[id]', params: { id: entry.workId } });
                  }
                },
                testID: `entries-row-${entry.receivableId}`,
              };
              return entry.status === 'confirmation_pending' ? (
                <ReceivableRow
                  key={entry.receivableId}
                  {...common}
                  disabled={false}
                  status="confirmation_pending"
                  confirming={confirmingId === entry.receivableId}
                  onConfirm={() => onConfirm(entry)}
                />
              ) : (
                <ReceivableRow key={entry.receivableId} {...common} status={entry.status} />
              );
            })}
          </View>
        </View>
      )}
    </TwoToneScrollScreen>
  );
}

/**
 * Resumo do mês acima da lista, no mesmo card de Finanças. Mês futuro não tem recebimento:
 * mostra o previsto e a quantidade de entradas.
 */
function EntriesSummary({
  data,
  tense,
  count,
  pending,
  name,
}: {
  data: FinanceMonth;
  tense: MonthTense;
  count: number;
  /** Datas passadas sem confirmação: a legenda chama a pessoa para confirmar. */
  pending: number;
  name: string;
}) {
  const { t } = useTranslation('finances');
  const type = useBrandTypography();
  if (tense === 'future') {
    return (
      <View style={styles.futureCard} testID="entries-summary">
        <View style={styles.futureRow}>
          <View style={styles.futureBlock}>
            <AppText variant="technical" style={styles.futureEyebrow}>
              {t('entries.expected')}
            </AppText>
            <AppText
              adjustsFontSizeToFit
              numberOfLines={1}
              style={[type.heading1, styles.futureValue]}
            >
              {money(data.expectedTotalCents)}
            </AppText>
          </View>
          <View style={[styles.futureBlock, styles.futureCount]}>
            <AppText variant="technical" style={styles.futureEyebrow}>
              {t('entries.count')}
            </AppText>
            <AppText style={[type.heading1, styles.futureValue]}>{String(count)}</AppText>
          </View>
        </View>
        <AppText style={styles.caption}>
          {t('entries.futureCaption', { month: name.toLowerCase() })}
        </AppText>
      </View>
    );
  }
  const caption =
    pending === 0
      ? splitCaption(data, tense, t)
      : pending === 1
        ? t('entries.pendingOne')
        : t('entries.pendingMany', { count: pending });
  return (
    <ReceiptProgressCard
      receivedLabel={t('entries.received')}
      receivedValue={money(data.receivedCents)}
      awaitingLabel={t('entries.awaiting')}
      awaitingValue={money(data.awaitingCents)}
      percent={receivedPercent(data)}
      caption={caption}
      testID="entries-summary"
    />
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 40 },
  sections: { gap: 26 },
  overlap: { marginTop: -(OVERLAP + 18) },
  error: { fontSize: 13, lineHeight: 18, color: palette.bronzeDeep },
  futureCard: {
    backgroundColor: '#F8F6EF',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(16,22,15,0.08)',
    padding: 18,
    gap: 12,
    shadowColor: colors.foreground,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
  },
  futureRow: { flexDirection: 'row', gap: 16 },
  futureBlock: { flex: 1, gap: 8 },
  futureCount: { flex: 0, alignItems: 'flex-end' },
  futureEyebrow: { fontSize: 10, lineHeight: 14, letterSpacing: 1.8, color: palette.sage },
  futureValue: { fontSize: 26, lineHeight: 30, letterSpacing: -0.78, color: colors.textPrimary },
  caption: { fontSize: 12, lineHeight: 16, color: palette.mutedCopy },
});
