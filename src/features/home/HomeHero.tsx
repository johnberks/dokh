import { StatusBar } from 'expo-status-bar';
import ArrowRight from 'lucide-react-native/icons/arrow-right';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { AppText } from '@/components/AppText';
import { BrandMark } from '@/components/BrandMark';
import { HeroBar } from '@/components/HeroBar';
import { type LocalMonth, shiftMonth } from '@/domain/calendar';
import { formatCentsToBRL } from '@/domain/money';
import { compactReais } from '@/features/finances/finance-format';
import { localDateToDate } from '@/features/work/work-schedule';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { fontAliases, palette } from '@/theme/tokens';
import type { HomeHero } from './home-data';
import {
  heroAmount,
  heroComparison,
  heroHistory,
  type MonthLine,
  monthLine,
  monthTense,
} from './home-format';

const MONTH_NAME = new Intl.DateTimeFormat('pt-BR', { month: 'long' });
const SHORT = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
const monthName = (month: LocalMonth) => MONTH_NAME.format(localDateToDate(`${month}-01`));
const money = (cents: bigint) => formatCentsToBRL(cents, { omitZeroCents: true });

/**
 * Espaço entre os cards e margem lateral. O segundo card aparece só numa faixa estreita (≈22 pt)
 * na borda direita — o bastante para mostrar que há outro card ao lado (pedido do usuário; o 2A
 * original mostrava ≈56 pt).
 */
const GAP = 10;
const SIDE = 24;
const PEEK = 32;
const CARD_HEIGHT = 178;

/**
 * Topo da Início: 2A (cards com peek) com o card do mês **denso** (referência do usuário):
 * rótulo, valor com `›` (abre Finanças), linha em degraus do previsto acumulado no mês (cheia até
 * hoje, apagada depois) e uma faixa no rodapé com a comparação com o mês anterior. O histórico
 * espia na borda direita; arrasta com snap e os pontos levam a ele. Sem histórico, um card só.
 */
export function HomeHeroCards({
  hero,
  month,
  today,
  firstName,
  onMonth,
  onAddWork,
  onAvatar,
  onOpenFinances,
}: {
  hero: HomeHero | undefined;
  month: LocalMonth;
  today: string;
  firstName: string | null;
  onMonth: (month: LocalMonth) => void;
  onAddWork: () => void;
  onAvatar: () => void;
  onOpenFinances: () => void;
}) {
  const { t } = useTranslation('home');
  const type = useBrandTypography();
  const { width } = useWindowDimensions();
  const scroller = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);

  const history = hero ? heroHistory(hero) : null;
  const name = monthName(month);
  const tense = monthTense(month, today);
  const amount = hero ? heroAmount(hero, tense, name, t) : null;
  const comparison = hero ? heroComparison(hero) : null;
  const previousName = monthName(shiftMonth(month, -1));
  const twoCards = history !== null;
  const cardWidth = twoCards ? width - SIDE - PEEK : width - SIDE * 2;

  function go(target: number) {
    scroller.current?.scrollTo({ x: target * (cardWidth + GAP), animated: true });
    setPage(target);
  }
  function onScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const next = event.nativeEvent.contentOffset.x > (cardWidth + GAP) / 2 ? 1 : 0;
    if (next !== page) setPage(next);
  }

  const line = hero ? monthLine(hero.entries, month, today) : null;
  const chartWidth = cardWidth;

  const monthCard = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('hero.openFinances')}
      onPress={() => (twoCards && page === 1 ? go(0) : onOpenFinances())}
      style={[styles.card, styles.monthCard, { width: cardWidth }]}
      testID="home-hero-month"
    >
      <View style={styles.monthTop}>
        <AppText variant="technical" numberOfLines={1} style={styles.cardEyebrow}>
          {tense === 'past'
            ? t('hero.eyebrowPast', { month: name.toUpperCase() })
            : t('hero.eyebrow', { month: name.toUpperCase() })}
        </AppText>
        {!hero ? null : amount ? (
          <View style={styles.amountRow}>
            <AppText
              adjustsFontSizeToFit
              numberOfLines={1}
              style={[type.heading1, styles.amount]}
              testID="home-hero-amount"
            >
              {money(amount.amount)}
            </AppText>
            <ChevronRight color={palette.secondaryText} size={22} strokeWidth={1.8} />
          </View>
        ) : (
          // Mês vazio: mensagem e ação no próprio card (nunca `R$ 0,00`).
          <View style={styles.emptyMonth} testID="home-no-entries">
            <AppText numberOfLines={2} style={[type.heading1, styles.emptyTitle]}>
              {t('empty.noEntriesTitle')}
            </AppText>
            <Pressable
              accessibilityRole="button"
              onPress={onAddWork}
              hitSlop={8}
              style={styles.emptyAction}
              testID="home-no-entries-action"
            >
              <AppText style={[type.heading1, styles.emptyActionText]}>
                {t('empty.addWork')}
              </AppText>
              <ArrowRight color={palette.bronze} size={14} strokeWidth={1.8} />
            </Pressable>
          </View>
        )}
      </View>

      {line ? <StepLine line={line} width={chartWidth} /> : null}

      {hero && amount ? (
        <View style={styles.monthFooter} testID="home-hero-comparison-strip">
          <AppText numberOfLines={1} style={styles.footerText}>
            {comparison && comparison.direction !== 'stable' ? (
              <>
                <AppText style={[type.heading1, styles.footerStrong]}>
                  {money(
                    comparison.deltaCents < 0n ? -comparison.deltaCents : comparison.deltaCents,
                  )}
                </AppText>
                {` ${t(comparison.direction === 'up' ? 'hero.moreThan' : 'hero.lessThan', {
                  month: previousName,
                })}`}
              </>
            ) : comparison ? (
              t('hero.comparisonStable', { month: previousName })
            ) : hero.openCount > 0 ? (
              hero.openCount === 1 ? (
                t('hero.countOne')
              ) : (
                t('hero.countMany', { count: hero.openCount })
              )
            ) : (
              amount.qualifier
            )}
          </AppText>
        </View>
      ) : null}
    </Pressable>
  );

  const historyCard = history ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('hero.historyLabel', {
        months: history
          .map((bar) => `${monthName(bar.month)} ${money(bar.expectedTotalCents)}`)
          .join(', '),
      })}
      onPress={() => go(1)}
      style={[styles.card, styles.historyCard, { width: cardWidth }]}
      testID="home-hero-history"
    >
      <AppText variant="technical" numberOfLines={1} style={styles.cardEyebrow}>
        {t('hero.historyEyebrow', { count: history.length })}
      </AppText>
      <View style={styles.historyChart}>
        {history.map((bar) => {
          const max = Math.max(...history.map((item) => Number(item.expectedTotalCents)));
          return (
            <View key={bar.month} style={styles.historyColumn}>
              <AppText
                numberOfLines={1}
                style={[
                  type.heading1,
                  styles.historyValue,
                  bar.current && styles.historyValueCurrent,
                ]}
              >
                {compactReais(bar.expectedTotalCents)}
              </AppText>
              <HeroBar
                height={Math.max(6, (Number(bar.expectedTotalCents) / max) * 62)}
                width={24}
                current={bar.current}
              />
            </View>
          );
        })}
      </View>
      <View style={styles.historyAxis}>
        {history.map((bar) => (
          <AppText
            key={bar.month}
            variant="technical"
            style={[styles.historyMonth, bar.current && styles.historyMonthCurrent]}
          >
            {SHORT[Number(bar.month.slice(5, 7)) - 1]}
          </AppText>
        ))}
      </View>
    </Pressable>
  ) : null;

  return (
    <View style={styles.hero}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <View style={styles.brand}>
          <BrandMark light size={22} />
          <AppText style={styles.brandName}>{t('brand')}</AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('avatar', { name: firstName ?? '' })}
          onPress={onAvatar}
          style={styles.avatar}
          testID="home-avatar"
        >
          <AppText style={[type.heading1, styles.avatarText]}>
            {(firstName ?? '•').charAt(0).toUpperCase()}
          </AppText>
        </Pressable>
      </View>

      <View style={styles.greetingRow}>
        <AppText
          adjustsFontSizeToFit
          minimumFontScale={0.8}
          numberOfLines={1}
          style={[type.heading1, styles.greeting]}
        >
          {firstName
            ? t('hero.greeting', { month: name, name: firstName })
            : t('hero.greetingNoName', { month: name })}
        </AppText>
        <View style={styles.stepper}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('previousMonth')}
            hitSlop={8}
            onPress={() => onMonth(shiftMonth(month, -1))}
            testID="home-month-previous"
            style={styles.stepperButton}
          >
            <ChevronLeft color={palette.secondaryText} size={18} />
          </Pressable>
          <AppText variant="technical" style={styles.stepperLabel} testID="home-month-title">
            {`${SHORT[Number(month.slice(5, 7)) - 1]} ${month.slice(0, 4)}`}
          </AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('nextMonth')}
            hitSlop={8}
            onPress={() => onMonth(shiftMonth(month, 1))}
            testID="home-month-next"
            style={styles.stepperButton}
          >
            <ChevronRight color={palette.secondaryText} size={18} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        ref={scroller}
        horizontal
        scrollEnabled={twoCards}
        showsHorizontalScrollIndicator={false}
        snapToInterval={cardWidth + GAP}
        decelerationRate="fast"
        disableIntervalMomentum
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.track}
        testID="home-hero-cards"
      >
        {monthCard}
        {historyCard}
      </ScrollView>

      {twoCards ? (
        <View style={styles.dots}>
          {[0, 1].map((index) => (
            <Pressable
              key={index}
              accessibilityRole="button"
              accessibilityLabel={index === 0 ? t('hero.pageMonth') : t('hero.pageHistory')}
              accessibilityState={{ selected: page === index }}
              hitSlop={12}
              onPress={() => go(index)}
              testID={`home-hero-dot-${index}`}
            >
              <View style={[styles.dot, page === index && styles.dotActive]} />
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const LINE_HEIGHT = 64;

/** Linha em degraus do previsto acumulado no mês, de ponta a ponta do card. */
function StepLine({ line, width }: { line: MonthLine; width: number }) {
  const days = line.cumulative.length;
  const top = 10;
  const bottom = LINE_HEIGHT - 6;
  const max = Math.max(1, line.total);
  const x = (day: number) => (day / days) * width;
  const y = (value: number) => bottom - (value / max) * (bottom - top);
  // Degrau depois de cada dia: horizontal pelo dia, sobe no início do seguinte.
  const path = (from: number, to: number) => {
    let d = `M ${x(from).toFixed(1)} ${y(from === 0 ? 0 : line.cumulative[from - 1]).toFixed(1)}`;
    for (let day = from; day < to; day++) {
      d += ` V ${y(line.cumulative[day]).toFixed(1)} H ${x(day + 1).toFixed(1)}`;
    }
    return d;
  };
  const split = Math.min(days, Math.max(0, line.todayIndex + 1));
  const solid = split > 0 ? path(0, split) : null;
  const rest = split < days ? path(split, days) : null;
  const todayValue = split > 0 ? line.cumulative[split - 1] : 0;
  return (
    <Svg width={width} height={LINE_HEIGHT} accessible={false} testID="home-hero-line">
      <Defs>
        <LinearGradient id="homeArea" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={palette.cream} stopOpacity={0.14} />
          <Stop offset="1" stopColor={palette.cream} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      {solid ? (
        <Path d={`${solid} V ${LINE_HEIGHT} H 0 Z`} fill="url(#homeArea)" stroke="none" />
      ) : null}
      {rest ? (
        <Path
          d={rest}
          fill="none"
          stroke="rgba(237,234,224,0.35)"
          strokeWidth={2}
          strokeDasharray="3 4"
        />
      ) : null}
      {solid ? <Path d={solid} fill="none" stroke={palette.cream} strokeWidth={2.4} /> : null}
      {split > 0 && split < days ? (
        <Circle
          cx={x(split)}
          cy={y(todayValue)}
          r={5}
          fill={palette.base}
          stroke={palette.cream}
          strokeWidth={2.4}
        />
      ) : null}
      <Circle cx={width - 7} cy={y(line.total)} r={3.5} fill={palette.sage} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  // Topo com folga: o verde tem a altura do próprio conteúdo mais respiro embaixo.
  hero: { overflow: 'hidden', paddingBottom: 30 },
  header: {
    paddingTop: 14,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandName: {
    fontFamily: fontAliases.unboundedSemibold,
    fontSize: 12,
    lineHeight: 14,
    letterSpacing: 0.24,
    color: palette.cream,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.structure,
    backgroundColor: '#161F14',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 14, lineHeight: 18, letterSpacing: 0, color: palette.cream },
  greetingRow: {
    paddingTop: 22,
    paddingHorizontal: SIDE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  greeting: {
    flexShrink: 1,
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: -0.44,
    color: palette.cream,
  },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stepperButton: { width: 28, height: 32, alignItems: 'center', justifyContent: 'center' },
  stepperLabel: { fontSize: 10, lineHeight: 14, letterSpacing: 1.8, color: palette.secondaryText },
  track: { paddingTop: 18, paddingHorizontal: SIDE, gap: GAP },
  // Card sólido e denso (referência do usuário): um tom acima do fundo, sem vidro nem brilho.
  card: {
    minHeight: CARD_HEIGHT,
    borderRadius: 18,
    backgroundColor: '#1D2A1A',
    overflow: 'hidden',
  },
  monthCard: { justifyContent: 'space-between' },
  monthTop: { paddingTop: 16, paddingHorizontal: 18, gap: 6 },
  cardEyebrow: {
    flexShrink: 1,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.8,
    color: palette.secondaryText,
  },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  amount: {
    flexShrink: 1,
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: -1.26,
    color: palette.cream,
  },
  monthFooter: {
    backgroundColor: 'rgba(0,0,0,0.24)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  footerText: { fontSize: 13, lineHeight: 18, color: palette.secondaryText },
  footerStrong: { fontSize: 13, letterSpacing: 0, color: palette.cream },
  historyCard: { paddingVertical: 16, paddingHorizontal: 18, gap: 8 },
  historyChart: {
    flex: 1,
    minHeight: 90,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(237,234,224,0.18)',
  },
  historyColumn: { width: 40, alignItems: 'center', gap: 6 },
  historyValue: { fontSize: 11, lineHeight: 14, letterSpacing: 0, color: palette.secondaryText },
  historyValueCurrent: { color: palette.cream },
  historyAxis: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
  historyMonth: {
    width: 40,
    textAlign: 'center',
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.4,
    color: palette.sage,
  },
  historyMonthCurrent: { color: palette.bronze },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingTop: 16 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(127,138,118,0.45)' },
  dotActive: { width: 22, backgroundColor: palette.bronze },
  emptyMonth: { gap: 12, paddingTop: 4, paddingBottom: 16 },
  emptyTitle: { fontSize: 20, lineHeight: 24, letterSpacing: -0.4, color: palette.cream },
  emptyAction: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  emptyActionText: { fontSize: 14, lineHeight: 18, letterSpacing: 0, color: palette.bronze },
});
