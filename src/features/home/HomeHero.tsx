import { StatusBar } from 'expo-status-bar';
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
import Svg, { Circle, Path } from 'react-native-svg';
import { AppText } from '@/components/AppText';
import { BrandMark } from '@/components/BrandMark';
import { EmptyState } from '@/components/EmptyState';
import { HeroBar } from '@/components/HeroBar';
import { type LocalMonth, shiftMonth } from '@/domain/calendar';
import { formatCentsToBRL } from '@/domain/money';
import { compactReais } from '@/features/finances/finance-format';
import { localDateToDate } from '@/features/work/work-schedule';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { fontAliases, palette } from '@/theme/tokens';
import type { HomeHero } from './home-data';
import { heroAmount, heroComparison, heroHistory, monthTense } from './home-format';

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
const CARD_HEIGHT = 190;

/**
 * Topo da Início na visão **2A — cards com peek** (`HOME.dc.html`): marca e avatar, saudação
 * com a troca de mês e as visões em cards lado a lado — o segundo (histórico) começa visível na
 * borda direita, então fica claro que há mais conteúdo. Arrasta com snap; tocar no card ou nos
 * pontos leva a ele. O olho oculta os valores. Sem histórico real, só o card do mês, largo.
 */
export function HomeHeroCards({
  hero,
  month,
  today,
  firstName,
  overlap,
  onMonth,
  onAddWork,
  onAvatar,
}: {
  hero: HomeHero | undefined;
  month: LocalMonth;
  today: string;
  firstName: string | null;
  overlap: number;
  onMonth: (month: LocalMonth) => void;
  onAddWork: () => void;
  onAvatar: () => void;
}) {
  const { t } = useTranslation('home');
  const type = useBrandTypography();
  const { width } = useWindowDimensions();
  const scroller = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);
  const [hidden, setHidden] = useState(false);

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

  const mask = (text: string) => (hidden ? 'R$ ••••' : text);

  const monthCard = (
    <Pressable
      accessibilityRole={twoCards ? 'button' : undefined}
      accessibilityLabel={twoCards ? t('hero.pageMonth') : undefined}
      disabled={!twoCards}
      onPress={() => go(0)}
      style={[styles.card, { width: cardWidth }]}
      testID="home-hero-month"
    >
      <AppText variant="technical" numberOfLines={1} style={styles.cardEyebrow}>
        {tense === 'past'
          ? t('hero.eyebrowPast', { month: name.toUpperCase() })
          : t('hero.eyebrow', { month: name.toUpperCase() })}
      </AppText>
      {!hero ? null : amount ? (
        <>
          <View style={styles.amountBlock}>
            <View style={styles.amountRow}>
              <AppText
                adjustsFontSizeToFit
                numberOfLines={1}
                style={[type.heading1, styles.amount]}
                testID="home-hero-amount"
              >
                {mask(money(amount.amount))}
              </AppText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={hidden ? t('hero.showValues') : t('hero.hideValues')}
                hitSlop={8}
                onPress={() => setHidden(!hidden)}
                style={styles.eye}
                testID="home-hero-eye"
              >
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12Z"
                    stroke={palette.secondaryText}
                    strokeWidth={1.7}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Circle
                    cx={12}
                    cy={12}
                    r={2.8}
                    stroke={palette.secondaryText}
                    strokeWidth={1.7}
                  />
                  {hidden ? (
                    <Path
                      d="M4 20 20 4"
                      stroke={palette.secondaryText}
                      strokeWidth={1.7}
                      strokeLinecap="round"
                    />
                  ) : null}
                </Svg>
              </Pressable>
            </View>
            <AppText numberOfLines={1} style={styles.cardSub}>
              {hero.openCount > 0
                ? hero.openCount === 1
                  ? t('hero.countOne')
                  : t('hero.countMany', { count: hero.openCount })
                : amount.qualifier}
            </AppText>
          </View>
          {comparison ? (
            <View style={styles.comparison} testID="home-hero-comparison">
              <AppText variant="technical" style={styles.comparisonBadge}>
                {`${comparison.direction === 'up' ? '↑' : comparison.direction === 'down' ? '↓' : '='} ${Math.abs(comparison.percent)}%`}
              </AppText>
              <AppText numberOfLines={1} style={styles.comparisonText}>
                {comparison.direction === 'stable'
                  ? t('hero.comparisonStable', { month: previousName })
                  : hidden
                    ? t(
                        comparison.direction === 'up' ? 'hero.comparisonUp' : 'hero.comparisonDown',
                        { value: 'R$ •••', month: previousName },
                      )
                    : t(
                        comparison.direction === 'up' ? 'hero.comparisonUp' : 'hero.comparisonDown',
                        {
                          value: money(
                            comparison.deltaCents < 0n
                              ? -comparison.deltaCents
                              : comparison.deltaCents,
                          ),
                          month: previousName,
                        },
                      )}
              </AppText>
            </View>
          ) : null}
        </>
      ) : (
        <EmptyState variant="homeEntries" onPrimaryPress={onAddWork} testID="home-no-entries" />
      )}
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
                {hidden ? '•••' : compactReais(bar.expectedTotalCents)}
              </AppText>
              <HeroBar
                height={Math.max(6, (Number(bar.expectedTotalCents) / max) * 58)}
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
    <View style={[styles.hero, { paddingBottom: 24 + overlap }]}>
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

const styles = StyleSheet.create({
  hero: { overflow: 'hidden' },
  header: {
    paddingTop: 16,
    paddingHorizontal: 32,
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
  // Card de vidro escuro do 2A: verde translúcido, borda sálvia e raio 22.
  // Altura mínima igual nos dois cards; o mês vazio (texto + ação) pode crescer.
  card: {
    minHeight: CARD_HEIGHT,
    borderRadius: 22,
    backgroundColor: 'rgba(43,58,36,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(127,138,118,0.28)',
    paddingVertical: 18,
    paddingHorizontal: 20,
    gap: 14,
  },
  historyCard: { gap: 12 },
  cardEyebrow: {
    flexShrink: 1,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.8,
    color: palette.secondaryText,
  },
  amountBlock: { gap: 6 },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  amount: {
    flexShrink: 1,
    fontSize: 44,
    lineHeight: 48,
    letterSpacing: -1.76,
    color: palette.cream,
  },
  eye: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(127,138,118,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardSub: { fontSize: 14, lineHeight: 18, color: palette.secondaryText },
  comparison: { marginTop: 'auto', flexDirection: 'row', alignItems: 'center', gap: 10 },
  comparisonBadge: {
    fontSize: 11,
    lineHeight: 15,
    color: palette.base,
    backgroundColor: palette.bronze,
    borderRadius: 6,
    overflow: 'hidden',
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  comparisonText: { flexShrink: 1, fontSize: 13, lineHeight: 18, color: palette.secondaryText },
  historyChart: {
    height: 96,
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
  historyAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: -5,
  },
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
});
