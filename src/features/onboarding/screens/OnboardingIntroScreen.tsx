import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { BrandMark } from '@/components/BrandMark';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { onboardingProfileMetrics as m, motion, palette } from '@/theme/tokens';
import { useReducedMotion } from '@/theme/useReducedMotion';
import { BrandBackdrop } from '../BrandBackdrop';

const CARD_HEIGHT = 64;
const CARD_GAP = 14;
/** Espaço à esquerda das peças alinhadas: é onde corre a linha que as conecta. */
const LINE_GUTTER = 26;

type Beat = 0 | 1 | 2;

/** Posição solta de cada peça (frações do palco) e o quanto ela entra torta. */
const SCATTER = [
  { x: 0.02, y: 0.06, rotate: -6 },
  { x: 0.42, y: 0.38, rotate: 5 },
  { x: 0.08, y: 0.68, rotate: -3 },
] as const;

/**
 * Tela 06 (Onboarding v2, 7.7): abertura narrativa, a justificativa de todo o resto.
 * 1. Peças soltas — "Seu trabalho acontece em vários lugares."
 * 2. Chips de pagamento encaixam — "E o dinheiro nem sempre entra quando você trabalha."
 * 3. As peças se alinham numa linha só — "A DOKH conecta seus trabalhos aos seus recebimentos."
 * Cada batida avança por toque (sem espera artificial). Cards claros sobre o fundo escuro, como
 * as janelas da tela 04: precisam ser lidos à primeira vista (pedido do usuário, 2026-10-02).
 * Com Reduzir movimento, as três frases aparecem juntas e as peças já organizadas.
 */
export function OnboardingIntroScreen() {
  const { t } = useTranslation('onboarding');
  const type = useBrandTypography();
  const insets = useContext(SafeAreaInsetsContext) ?? { top: 0, bottom: 0 };
  const reduced = useReducedMotion();
  const [beat, setBeat] = useState<Beat>(0);
  const [stage, setStage] = useState({ width: 0, height: 0 });
  const entered = useSharedValue(0);
  const chips = useSharedValue(0);
  const aligned = useSharedValue(0);
  const finalBeat: Beat = reduced ? 2 : beat;

  const measured = stage.width > 0;

  useEffect(() => {
    if (reduced) {
      entered.value = 1;
      chips.value = 1;
      aligned.value = 1;
      return;
    }
    // A entrada só começa com o palco medido: antes disso as peças não têm onde aparecer.
    if (measured) entered.value = withTiming(1, { duration: motion.storyEnter * 1.6 });
  }, [aligned, chips, entered, measured, reduced]);

  function advance() {
    if (finalBeat === 2) return;
    const next = (beat + 1) as Beat;
    setBeat(next);
    if (next === 1) chips.value = withTiming(1, { duration: motion.storyChips * 2 });
    if (next === 2) aligned.value = withTiming(1, { duration: motion.storyAlign });
  }

  function onStageLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    setStage({ width, height });
  }

  const cards = [
    {
      title: t('profile.intro.card1Title'),
      meta: t('profile.intro.card1Meta'),
      chip: t('profile.intro.card1Chip'),
    },
    {
      title: t('profile.intro.card2Title'),
      meta: t('profile.intro.card2Meta'),
      chip: t('profile.intro.card2Chip'),
    },
    {
      title: t('profile.intro.card3Title'),
      meta: t('profile.intro.card3Meta'),
      chip: t('profile.intro.card3Chip'),
    },
  ];
  const headline = [t('profile.intro.beat1'), t('profile.intro.beat2'), t('profile.intro.beat3')][
    finalBeat
  ];

  return (
    <Pressable
      accessible={false}
      // Tocar em qualquer lugar avança a história; o botão faz o mesmo para leitores de tela.
      onPress={advance}
      style={[
        styles.screen,
        { paddingTop: insets.top + 22, paddingBottom: Math.max(insets.bottom, 24) + 20 },
      ]}
      testID="onboarding-intro"
    >
      <StatusBar style="light" />
      <BrandBackdrop variant="intro" />
      <View style={styles.wordmark}>
        <BrandMark light size={22} />
        <AppText style={[type.wordmark, styles.wordmarkText]}>{t('welcome.splash.label')}</AppText>
      </View>

      <View style={styles.copy}>
        {reduced ? (
          <>
            <AppText style={styles.stackedLine}>{t('profile.intro.beat1')}</AppText>
            <AppText style={styles.stackedLine}>{t('profile.intro.beat2')}</AppText>
          </>
        ) : null}
        <Animated.View
          key={finalBeat}
          entering={reduced ? undefined : FadeIn.duration(motion.enter)}
        >
          <AppText accessibilityRole="header" style={[type.heading1, styles.title]}>
            {headline}
          </AppText>
          {finalBeat === 2 && (
            <AppText style={styles.description}>{t('profile.intro.beat3Description')}</AppText>
          )}
        </Animated.View>
      </View>

      <View style={styles.stage} onLayout={onStageLayout} testID="intro-stage">
        {measured && (
          <>
            <ConnectionLine aligned={aligned} stage={stage} />
            {cards.map((card, index) => (
              <StoryCard
                key={card.title}
                index={index}
                card={card}
                stage={stage}
                entered={entered}
                chips={chips}
                aligned={aligned}
              />
            ))}
          </>
        )}
      </View>

      <View style={styles.footer}>
        {finalBeat < 2 && <AppText style={styles.hint}>{t('profile.intro.hint')}</AppText>}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={finalBeat === 2 ? t('profile.intro.cta') : t('profile.intro.next')}
          onPress={() => (finalBeat === 2 ? router.push('/name') : advance())}
          testID="onboarding-intro-cta"
          style={({ pressed }) => [
            styles.cta,
            finalBeat < 2 && styles.ctaGhost,
            pressed && styles.pressed,
          ]}
        >
          <AppText style={[type.heading1, styles.ctaLabel, finalBeat < 2 && styles.ctaGhostLabel]}>
            {finalBeat === 2 ? t('profile.intro.cta') : t('profile.intro.next')}
          </AppText>
          {finalBeat === 2 && (
            <AppText accessible={false} style={[type.heading1, styles.ctaArrow]}>
              {'→'}
            </AppText>
          )}
        </Pressable>
      </View>
    </Pressable>
  );
}

type StageSize = { width: number; height: number };

function alignedTop(stage: StageSize) {
  return Math.max(0, (stage.height - (CARD_HEIGHT * 3 + CARD_GAP * 2)) / 2);
}

/** Uma peça: solta e torta → com o chip do pagamento → alinhada às outras. */
function StoryCard({
  index,
  card,
  stage,
  entered,
  chips,
  aligned,
}: {
  index: number;
  card: { title: string; meta: string; chip: string };
  stage: StageSize;
  entered: SharedValue<number>;
  chips: SharedValue<number>;
  aligned: SharedValue<number>;
}) {
  const type = useBrandTypography();
  const scatter = SCATTER[index];
  const looseWidth = Math.min(190, stage.width * 0.56);
  const from = {
    left: Math.min(stage.width * scatter.x, stage.width - looseWidth),
    top: Math.min(stage.height * scatter.y, stage.height - CARD_HEIGHT),
    width: looseWidth,
  };
  const to = {
    left: LINE_GUTTER,
    top: alignedTop(stage) + index * (CARD_HEIGHT + CARD_GAP),
    width: stage.width - LINE_GUTTER,
  };
  // Cada peça entra e recebe o chip um pouco depois da anterior.
  const start = index * 0.18;

  const cardStyle = useAnimatedStyle(() => {
    const appear = interpolate(entered.value, [start, Math.min(1, start + 0.6)], [0, 1], 'clamp');
    const a = aligned.value;
    return {
      opacity: appear,
      left: from.left + (to.left - from.left) * a,
      top: from.top + (to.top - from.top) * a + (1 - appear) * 14,
      width: from.width + (to.width - from.width) * a,
      transform: [{ rotate: `${scatter.rotate * (1 - a)}deg` }],
    };
  });
  const chipStyle = useAnimatedStyle(() => {
    const shown = interpolate(chips.value, [start, Math.min(1, start + 0.55)], [0, 1], 'clamp');
    return { opacity: shown, transform: [{ scale: 0.7 + 0.3 * shown }] };
  });

  return (
    <Animated.View style={[styles.card, cardStyle]} testID={`intro-card-${index}`}>
      <AppText numberOfLines={1} style={[type.heading1, styles.cardTitle]}>
        {card.title}
      </AppText>
      <AppText variant="technical" numberOfLines={1} style={styles.cardMeta}>
        {card.meta}
      </AppText>
      <Animated.View style={[styles.chip, chipStyle]}>
        <AppText style={[type.heading1, styles.chipText]}>{card.chip}</AppText>
      </Animated.View>
    </Animated.View>
  );
}

/** A linha bronze que passa por todas as peças quando elas se alinham. */
function ConnectionLine({ aligned, stage }: { aligned: SharedValue<number>; stage: StageSize }) {
  const top = alignedTop(stage) + CARD_HEIGHT / 2;
  const full = 2 * (CARD_HEIGHT + CARD_GAP);
  const lineStyle = useAnimatedStyle(() => ({
    height: interpolate(aligned.value, [0.4, 1], [0, full], 'clamp'),
  }));
  return <Animated.View style={[styles.line, { top }, lineStyle]} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.base, paddingHorizontal: 32 },
  wordmark: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  wordmarkText: { fontSize: 12, lineHeight: 14, color: palette.cream },
  copy: { marginTop: 36, gap: 8, minHeight: 120 },
  stackedLine: { fontSize: 15, lineHeight: 21, color: palette.secondaryText },
  title: { fontSize: 30, lineHeight: 33, letterSpacing: -1.05, color: palette.cream },
  description: { marginTop: 12, fontSize: 15, lineHeight: 23, color: palette.secondaryText },
  stage: { flex: 1, marginVertical: 20 },
  card: {
    position: 'absolute',
    height: CARD_HEIGHT,
    borderRadius: 14,
    backgroundColor: '#1B2418',
    borderWidth: 1,
    borderColor: 'rgba(237,234,224,0.10)',
    paddingHorizontal: 14,
    justifyContent: 'center',
    gap: 3,
  },
  cardTitle: {
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: -0.14,
    color: palette.cream,
    marginRight: 52,
  },
  cardMeta: { fontSize: 9, lineHeight: 12, letterSpacing: 1.3, color: palette.sage },
  chip: {
    position: 'absolute',
    right: 10,
    top: 10,
    borderRadius: 999,
    backgroundColor: palette.bronze,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  chipText: { fontSize: 11, lineHeight: 14, letterSpacing: 0, color: palette.base },
  line: {
    position: 'absolute',
    left: 10,
    width: 2,
    borderRadius: 1,
    backgroundColor: palette.bronze,
  },
  footer: { gap: 12 },
  hint: { textAlign: 'center', fontSize: 13, lineHeight: 18, color: palette.sage },
  cta: {
    minHeight: m.ctaHeight,
    borderRadius: m.ctaRadius,
    backgroundColor: palette.cream,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  ctaGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(237,234,224,0.32)',
  },
  ctaLabel: { fontSize: 16, lineHeight: 20, letterSpacing: 0, color: palette.base },
  ctaGhostLabel: { color: palette.cream },
  ctaArrow: { fontSize: 18, lineHeight: 20, letterSpacing: 0, color: palette.base },
  pressed: { opacity: 0.72 },
});
