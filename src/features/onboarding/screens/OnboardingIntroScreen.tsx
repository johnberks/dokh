import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  FadeIn,
  interpolate,
  runOnJS,
  type SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { BrandMark } from '@/components/BrandMark';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { onboardingProfileMetrics as m, motion, palette } from '@/theme/tokens';
import { useReducedMotion } from '@/theme/useReducedMotion';
import { BrandBackdrop } from '../BrandBackdrop';

const CARD_HEIGHT = 68;
const CARD_GAP = 14;
/** Espaço à esquerda das peças alinhadas: é onde corre a linha que as conecta. */
const LINE_GUTTER = 26;
const KNOB = 56;
/** Soltar depois deste ponto completa a organização; antes, as peças voltam a se espalhar. */
const COMPLETE_AT = 0.85;

type Beat = 0 | 1 | 2;

/** Posição solta de cada peça (frações do palco) e o quanto ela entra torta. */
const SCATTER = [
  { x: 0.02, y: 0.04, rotate: -7 },
  { x: 0.44, y: 0.36, rotate: 6 },
  { x: 0.08, y: 0.68, rotate: -4 },
] as const;

/** Em que ponto do arrasto a história muda de frase. */
function beatOf(progress: number): Beat {
  'worklet';
  return progress >= 0.68 ? 2 : progress >= 0.25 ? 1 : 0;
}

/**
 * Tela 06 (Onboarding v2, 7.7): a abertura é **uma tela só, guiada pelo dedo** (pedido do
 * usuário, 2026-10-02 — "nada de clicar no botão só para trocar a imagem"). Referências Mobbin:
 * Sunlitt (arrastar e ver a cena reagir), Play (avançar deslizando) e Craft (aprender mexendo).
 *
 * Arrastar "Organizar" move a história continuamente: as peças soltas recebem os chips de
 * pagamento (D30 · DIA 05 · D60), depois se endireitam e se alinham pela linha bronze, e a frase
 * acompanha o gesto. Soltar no fim completa; antes, tudo volta a se espalhar. Tocar no trilho
 * organiza sozinho. Concluído, o trilho vira "Configurar minha DOKH".
 * Com Reduzir movimento, as três frases aparecem juntas e as peças já organizadas.
 */
export function OnboardingIntroScreen() {
  const { t } = useTranslation('onboarding');
  const type = useBrandTypography();
  const insets = useContext(SafeAreaInsetsContext) ?? { top: 0, bottom: 0 };
  const reduced = useReducedMotion();
  const [beat, setBeat] = useState<Beat>(0);
  const [done, setDone] = useState(false);
  const [stage, setStage] = useState({ width: 0, height: 0 });
  const [trackWidth, setTrackWidth] = useState(0);
  const progress = useSharedValue(0);
  const entered = useSharedValue(0);
  const float = useSharedValue(0);
  const dragStart = useRef(0);
  const measured = stage.width > 0;
  const travel = Math.max(1, trackWidth - KNOB);
  const shownBeat: Beat = reduced ? 2 : beat;

  useEffect(() => {
    if (reduced) {
      progress.value = 1;
      entered.value = 1;
      setDone(true);
      return;
    }
    if (!measured) return;
    entered.value = withTiming(1, { duration: motion.storyEnter * 1.6 });
    // Peças soltas "respiram" devagar até serem organizadas: é o que convida a mexer.
    float.value = withRepeat(
      withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [entered, float, measured, progress, reduced]);

  // A frase acompanha o gesto (e a animação automática do toque).
  useAnimatedReaction(
    () => beatOf(progress.value),
    (current, previous) => {
      if (current !== previous) runOnJS(setBeat)(current);
    },
  );

  function complete() {
    setDone(true);
  }

  function organize() {
    if (done) return;
    progress.value = withTiming(
      1,
      { duration: motion.storyAlign * 2.6, easing: Easing.inOut(Easing.cubic) },
      (finished) => {
        if (finished) runOnJS(complete)();
      },
    );
  }

  const pan = Gesture.Pan()
    .runOnJS(true)
    .withTestId('intro-drag')
    .enabled(!done)
    .onBegin(() => {
      dragStart.current = progress.value;
    })
    .onUpdate((event) => {
      progress.value = Math.min(1, Math.max(0, dragStart.current + event.translationX / travel));
    })
    .onEnd(() => {
      if (progress.value >= COMPLETE_AT) {
        progress.value = withTiming(1, { duration: motion.feedback }, (finished) => {
          if (finished) runOnJS(complete)();
        });
      } else {
        progress.value = withSpring(0, { damping: 18, stiffness: 140 });
      }
    });
  const tap = Gesture.Tap().runOnJS(true).enabled(!done).onEnd(organize);
  const gesture = Gesture.Exclusive(pan, tap);

  const headlines = [t('profile.intro.beat1'), t('profile.intro.beat2'), t('profile.intro.beat3')];
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

  return (
    <View
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

      {reduced ? (
        <View style={styles.copy}>
          <AppText style={styles.stackedLine}>{headlines[0]}</AppText>
          <AppText style={styles.stackedLine}>{headlines[1]}</AppText>
          <AppText accessibilityRole="header" style={[type.heading1, styles.title]}>
            {headlines[2]}
          </AppText>
          <AppText style={styles.description}>{t('profile.intro.beat3Description')}</AppText>
        </View>
      ) : (
        <View style={styles.copy}>
          {headlines.map((text, index) => (
            <Headline
              key={text}
              index={index as Beat}
              current={shownBeat === index}
              progress={progress}
              text={text}
              description={index === 2 ? t('profile.intro.beat3Description') : undefined}
            />
          ))}
        </View>
      )}

      <View
        style={styles.stage}
        onLayout={(event: LayoutChangeEvent) => {
          const { width, height } = event.nativeEvent.layout;
          setStage({ width, height });
        }}
        testID="intro-stage"
      >
        {measured && (
          <>
            <ConnectionLine progress={progress} stage={stage} />
            {cards.map((card, index) => (
              <StoryCard
                key={card.title}
                index={index}
                card={card}
                stage={stage}
                entered={entered}
                float={float}
                progress={progress}
              />
            ))}
          </>
        )}
      </View>

      {done ? (
        <Animated.View entering={reduced ? undefined : FadeIn.duration(motion.enter)}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('profile.intro.cta')}
            onPress={() => router.push('/name')}
            testID="onboarding-intro-cta"
            style={({ pressed }) => [styles.cta, pressed && styles.pressed]}
          >
            <AppText style={[type.heading1, styles.ctaLabel]}>{t('profile.intro.cta')}</AppText>
            <AppText accessible={false} style={[type.heading1, styles.ctaArrow]}>
              {'→'}
            </AppText>
          </Pressable>
        </Animated.View>
      ) : (
        <GestureDetector gesture={gesture}>
          <View
            accessible
            accessibilityRole="adjustable"
            accessibilityLabel={t('profile.intro.dragLabel')}
            accessibilityHint={t('profile.intro.dragHint')}
            accessibilityActions={[{ name: 'activate' }, { name: 'increment' }]}
            onAccessibilityAction={organize}
            onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
            style={styles.track}
            testID="onboarding-intro-organize"
          >
            <DragTrack progress={progress} travel={travel} label={t('profile.intro.drag')} />
          </View>
        </GestureDetector>
      )}
    </View>
  );
}

/** As três frases ficam empilhadas e trocam conforme o arrasto, sem cortes secos. */
function Headline({
  index,
  current,
  progress,
  text,
  description,
}: {
  index: Beat;
  current: boolean;
  progress: SharedValue<number>;
  text: string;
  description?: string;
}) {
  const type = useBrandTypography();
  const style = useAnimatedStyle(() => {
    const p = progress.value;
    const opacity =
      index === 0
        ? interpolate(p, [0.15, 0.27], [1, 0], 'clamp')
        : index === 1
          ? interpolate(p, [0.18, 0.3, 0.6, 0.72], [0, 1, 1, 0], 'clamp')
          : interpolate(p, [0.62, 0.76], [0, 1], 'clamp');
    return { opacity, transform: [{ translateY: (1 - opacity) * 8 }] };
  });
  return (
    <Animated.View
      // Só a frase do momento é lida pelo leitor de tela.
      accessibilityElementsHidden={!current}
      importantForAccessibility={current ? 'auto' : 'no-hide-descendants'}
      style={[styles.headline, style]}
    >
      <AppText accessibilityRole="header" style={[type.heading1, styles.title]}>
        {text}
      </AppText>
      {description ? <AppText style={styles.description}>{description}</AppText> : null}
    </Animated.View>
  );
}

/** Trilho com o botão que se arrasta; o rastro bronze mostra quanto já foi organizado. */
function DragTrack({
  progress,
  travel,
  label,
}: {
  progress: SharedValue<number>;
  travel: number;
  label: string;
}) {
  const type = useBrandTypography();
  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * travel }],
  }));
  const fillStyle = useAnimatedStyle(() => ({ width: KNOB + progress.value * travel }));
  const labelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.4], [1, 0], 'clamp'),
  }));
  return (
    <>
      <Animated.View style={[styles.trackFill, fillStyle]} />
      <Animated.View style={[styles.trackLabelBox, labelStyle]}>
        <AppText style={[type.heading1, styles.trackLabel]}>{label}</AppText>
      </Animated.View>
      <Animated.View style={[styles.knob, knobStyle]}>
        <AppText accessible={false} style={[type.heading1, styles.knobArrow]}>
          {'→'}
        </AppText>
      </Animated.View>
    </>
  );
}

type StageSize = { width: number; height: number };

function alignedTop(stage: StageSize) {
  return Math.max(0, (stage.height - (CARD_HEIGHT * 3 + CARD_GAP * 2)) / 2);
}

/** Uma peça: solta e torta → com o chip do pagamento → alinhada às outras, conforme o arrasto. */
function StoryCard({
  index,
  card,
  stage,
  entered,
  float,
  progress,
}: {
  index: number;
  card: { title: string; meta: string; chip: string };
  stage: StageSize;
  entered: SharedValue<number>;
  float: SharedValue<number>;
  progress: SharedValue<number>;
}) {
  const type = useBrandTypography();
  const scatter = SCATTER[index];
  const looseWidth = Math.min(196, stage.width * 0.58);
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
  const start = index * 0.18;
  // Cada chip encaixa num trecho do arrasto, um depois do outro.
  const chipFrom = 0.06 + index * 0.1;

  const cardStyle = useAnimatedStyle(() => {
    const appear = interpolate(entered.value, [start, Math.min(1, start + 0.6)], [0, 1], 'clamp');
    const a = interpolate(progress.value, [0.42, 0.95], [0, 1], 'clamp');
    const sway = (index % 2 === 0 ? float.value : 1 - float.value) * 6 - 3;
    return {
      opacity: appear,
      left: from.left + (to.left - from.left) * a,
      top: from.top + (to.top - from.top) * a + (1 - appear) * 14 + sway * (1 - a),
      width: from.width + (to.width - from.width) * a,
      transform: [{ rotate: `${scatter.rotate * (1 - a)}deg` }],
    };
  });
  const chipStyle = useAnimatedStyle(() => {
    const shown = interpolate(progress.value, [chipFrom, chipFrom + 0.12], [0, 1], 'clamp');
    return {
      opacity: shown,
      transform: [{ translateY: (1 - shown) * -10 }, { scale: 0.7 + 0.3 * shown }],
    };
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
function ConnectionLine({ progress, stage }: { progress: SharedValue<number>; stage: StageSize }) {
  const top = alignedTop(stage) + CARD_HEIGHT / 2;
  const full = 2 * (CARD_HEIGHT + CARD_GAP);
  const lineStyle = useAnimatedStyle(() => ({
    height: interpolate(progress.value, [0.7, 1], [0, full], 'clamp'),
  }));
  return <Animated.View style={[styles.line, { top }, lineStyle]} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.base, paddingHorizontal: 32 },
  wordmark: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  wordmarkText: { fontSize: 12, lineHeight: 14, color: palette.cream },
  copy: { marginTop: 36, minHeight: 132, gap: 8 },
  headline: { position: 'absolute', left: 0, right: 0, top: 0 },
  stackedLine: { fontSize: 15, lineHeight: 21, color: palette.secondaryText },
  title: { fontSize: 30, lineHeight: 33, letterSpacing: -1.05, color: palette.cream },
  description: { marginTop: 12, fontSize: 15, lineHeight: 23, color: palette.secondaryText },
  stage: { flex: 1, marginVertical: 16 },
  card: {
    position: 'absolute',
    height: CARD_HEIGHT,
    borderRadius: 16,
    backgroundColor: palette.cream,
    paddingHorizontal: 16,
    justifyContent: 'center',
    gap: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.32,
    shadowRadius: 16,
    elevation: 10,
  },
  cardTitle: {
    fontSize: 15,
    lineHeight: 19,
    letterSpacing: -0.15,
    color: palette.base,
    marginRight: 60,
  },
  cardMeta: { fontSize: 10, lineHeight: 13, letterSpacing: 1.3, color: palette.mutedCopy },
  chip: {
    position: 'absolute',
    right: 12,
    top: 12,
    borderRadius: 999,
    backgroundColor: palette.bronze,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  chipText: { fontSize: 11, lineHeight: 14, letterSpacing: 0, color: palette.base },
  line: {
    position: 'absolute',
    left: 10,
    width: 2,
    borderRadius: 1,
    backgroundColor: palette.bronze,
  },
  track: {
    height: KNOB,
    borderRadius: m.ctaRadius,
    borderWidth: 1,
    borderColor: 'rgba(237,234,224,0.24)',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  trackFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(169,138,84,0.28)',
  },
  trackLabelBox: { position: 'absolute', left: KNOB, right: 0, alignItems: 'center' },
  trackLabel: { fontSize: 15, lineHeight: 19, letterSpacing: 0, color: palette.cream },
  knob: {
    position: 'absolute',
    left: 0,
    top: -1,
    width: KNOB,
    height: KNOB,
    borderRadius: m.ctaRadius,
    backgroundColor: palette.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  knobArrow: { fontSize: 20, lineHeight: 22, letterSpacing: 0, color: palette.base },
  cta: {
    minHeight: m.ctaHeight,
    borderRadius: m.ctaRadius,
    backgroundColor: palette.cream,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  ctaLabel: { fontSize: 16, lineHeight: 20, letterSpacing: 0, color: palette.base },
  ctaArrow: { fontSize: 18, lineHeight: 20, letterSpacing: 0, color: palette.base },
  pressed: { opacity: 0.72 },
});
