import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { ArrowDownIcon, ArrowRightIcon } from '@/components/icons/heroicons';
import { Reveal } from '@/components/Reveal';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { motion, palette, shadow } from '@/theme/tokens';
import { currentTourStep, type TourRect, type TourTab, useGuideTour } from './guide-tour';
import { TOUR_MEASURE_DELAY } from './useTourTarget';

const TAB_HREF: Record<TourTab, '/' | '/agenda' | '/finances'> = {
  index: '/',
  agenda: '/agenda',
  finances: '/finances',
};

/** Folga do recorte em volta do alvo e distância até o balão. */
const PAD = 8;
const GAP = 14;
const EDGE = 16;
const ARROW = 12;
/** Sem medida (alvo ausente), o balão aparece centralizado, sem recorte. */
const FALLBACK_DELAY = TOUR_MEASURE_DELAY + 700;
const DIM = 'rgba(16,22,15,0.62)';

/**
 * Guia de primeiro uso (referências da Mobbin: monday.com, MD Vinyl e Mesh — balão com seta,
 * contador, Pular e Próximo): escurece a tela, recorta o elemento do passo e explica em uma frase.
 * Troca de aba sozinho quando o passo pede. "Pular" encerra na hora; "Concluir" volta ao Início.
 * Começa sem pressa (pedido do usuário, 2026-09-28): a Início aparece sozinha por 3 s, o véu
 * escurece devagar e o balão chega logo depois. Na passagem para Agenda e Finanças, o botão
 * diz para onde vai ("Ir para Agenda") e a aba de destino acende na barra, com uma legenda,
 * antes de a tela trocar — a pessoa vê onde está indo (pedido do usuário, 2026-09-29).
 */
export function GuideTourOverlay() {
  const { t } = useTranslation('navigation');
  const type = useBrandTypography();
  const insets = useSafeAreaInsets();
  const window = useWindowDimensions();
  const index = useGuideTour((state) => state.step);
  const steps = useGuideTour((state) => state.steps);
  const rects = useGuideTour((state) => state.rects);
  const next = useGuideTour((state) => state.next);
  const finish = useGuideTour((state) => state.finish);
  const going = useGuideTour((state) => state.going);
  const goTo = useGuideTour((state) => state.goTo);
  const [bubbleHeight, setBubbleHeight] = useState(0);
  const [fallback, setFallback] = useState(false);
  // O primeiro passo espera a Início ser vista; os seguintes seguem direto.
  const [started, setStarted] = useState(false);
  const step = currentTourStep(index, steps);
  const tab = step?.tab;
  // O guia começa pela seção do foco escolhido (7.7), não sempre pela Início.
  const firstTab = steps[0]?.tab ?? 'index';

  // Cada passo abre a aba dele; o alvo se mede depois que a aba assenta.
  useEffect(() => {
    if (!tab) return;
    router.navigate(TAB_HREF[tab]);
  }, [tab]);

  const touring = index !== null;
  useEffect(() => {
    if (!touring) {
      setStarted(false);
      return;
    }
    const timer = setTimeout(() => {
      // Se a pessoa trocou de aba durante a espera, o primeiro passo volta à seção dele.
      router.navigate(TAB_HREF[firstTab]);
      setStarted(true);
    }, motion.guideStartDelay);
    return () => clearTimeout(timer);
  }, [touring, firstTab]);

  // A aba de destino fica acesa um instante; só então o próximo passo (e a troca de aba).
  useEffect(() => {
    if (!going) return;
    const timer = setTimeout(next, motion.guideTransition);
    return () => clearTimeout(timer);
  }, [going, next]);

  useEffect(() => {
    setFallback(false);
    if (index === null || !started) return;
    const timer = setTimeout(() => setFallback(true), FALLBACK_DELAY);
    return () => clearTimeout(timer);
  }, [index, started]);

  if (!step || index === null || !started) return null;
  const goingTarget =
    going === 'agenda'
      ? 'tab-agenda'
      : going === 'finances'
        ? 'tab-finances'
        : going === 'index'
          ? 'tab-index'
          : null;
  const rect: TourRect | undefined = goingTarget ? rects[goingTarget] : rects[step.target];
  // Enquanto a aba troca, só o véu: nada de balão apontando para o lugar errado.
  const showBubble = !going && (Boolean(rect) || fallback);

  const last = index === steps.length - 1;
  const upcoming = steps[index + 1];
  // O próximo passo está em outra aba: o botão já diz para onde vai.
  const switchingTo = upcoming && upcoming.tab !== step.tab ? upcoming.tab : null;
  const nextLabel = last
    ? t('guide.done')
    : switchingTo
      ? t(`guide.goTo.${switchingTo}`)
      : t('guide.next');
  const hole = rect
    ? {
        x: rect.x - PAD,
        y: rect.y - PAD,
        width: rect.width + PAD * 2,
        height: rect.height + PAD * 2,
      }
    : null;
  const bottomLimit = window.height - insets.bottom - EDGE;
  const below = hole ? hole.y + hole.height + GAP + bubbleHeight <= bottomLimit : false;
  const bubbleTop = hole
    ? below
      ? hole.y + hole.height + GAP
      : Math.max(insets.top + EDGE, hole.y - GAP - bubbleHeight)
    : (window.height - bubbleHeight) / 2;
  const arrowLeft = hole
    ? Math.min(
        window.width - EDGE * 2 - ARROW * 2,
        Math.max(ARROW, hole.x + hole.width / 2 - EDGE - ARROW / 2),
      )
    : null;

  function advance() {
    if (last) {
      finish();
      router.navigate('/');
      return;
    }
    if (switchingTo) {
      goTo(switchingTo);
      return;
    }
    next();
  }

  return (
    <View style={StyleSheet.absoluteFill} testID="guide-tour">
      {/* Um só véu para o tour inteiro: escurece devagar uma vez e só muda o recorte. */}
      <Reveal rise={0} duration={motion.guideVeil} style={StyleSheet.absoluteFill}>
        {hole ? (
          <>
            {/* Quatro faixas escuras em volta do recorte: o alvo fica aceso e visível. */}
            <View
              style={[styles.veil, { top: 0, left: 0, right: 0, height: Math.max(0, hole.y) }]}
            />
            <View
              style={[styles.veil, { top: hole.y + hole.height, left: 0, right: 0, bottom: 0 }]}
            />
            <View
              style={[
                styles.veil,
                { top: hole.y, left: 0, width: Math.max(0, hole.x), height: hole.height },
              ]}
            />
            <View
              style={[
                styles.veil,
                { top: hole.y, left: hole.x + hole.width, right: 0, height: hole.height },
              ]}
            />
            <Reveal
              key={`ring-${index}-${going ?? ''}`}
              rise={0}
              scaleFrom={1.06}
              delay={motion.guideBubbleDelay}
              duration={motion.guideBubble}
              style={[
                styles.ring,
                { top: hole.y, left: hole.x, width: hole.width, height: hole.height },
              ]}
            />
          </>
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.veil]} />
        )}
      </Reveal>

      {showBubble && (
        <Reveal
          key={`bubble-${index}`}
          rise={below ? -12 : 12}
          delay={motion.guideBubbleDelay}
          duration={motion.guideBubble}
          style={[styles.bubble, { top: bubbleTop }]}
        >
          <View
            accessibilityViewIsModal
            accessibilityLiveRegion="polite"
            onLayout={(event) => setBubbleHeight(event.nativeEvent.layout.height)}
            style={styles.card}
            testID="guide-tour-card"
          >
            {arrowLeft !== null && (
              <View
                style={[
                  styles.arrow,
                  below ? { top: -ARROW / 2 } : { bottom: -ARROW / 2 },
                  { left: arrowLeft },
                ]}
              />
            )}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <AppText variant="technical" style={styles.section}>
                  {t(`guide.sections.${step.tab}`)}
                </AppText>
                <AppText variant="technical" style={styles.progress}>
                  {t('guide.progress', { current: index + 1, total: steps.length })}
                </AppText>
              </View>
              {!last && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('guide.skip')}
                  hitSlop={10}
                  onPress={finish}
                  testID="guide-tour-skip"
                  style={({ pressed }) => [styles.skip, pressed && styles.pressed]}
                >
                  <AppText style={[type.heading1, styles.skipLabel]}>{t('guide.skip')}</AppText>
                </Pressable>
              )}
            </View>
            <AppText accessibilityRole="header" style={[type.heading1, styles.title]}>
              {t(`guide.${step.key}.title`)}
            </AppText>
            <AppText style={styles.body}>{t(`guide.${step.key}.body`)}</AppText>
            <View style={styles.footer}>
              <View style={styles.dots}>
                {steps.map((item, dot) => (
                  <View key={item.key} style={[styles.dot, dot === index && styles.dotOn]} />
                ))}
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={nextLabel}
                onPress={advance}
                testID="guide-tour-next"
                style={({ pressed }) => [styles.next, pressed && styles.pressed]}
              >
                <AppText style={[type.heading1, styles.nextLabel]}>{nextLabel}</AppText>
                {switchingTo ? <ArrowRightIcon size={14} color={palette.base} /> : null}
              </Pressable>
            </View>
          </View>
        </Reveal>
      )}

      {going && hole ? (
        // Passagem entre seções: legenda logo acima da aba acesa na barra.
        <Reveal
          key={`going-${going}`}
          rise={10}
          duration={motion.guideBubble}
          style={[styles.goingWrap, { bottom: window.height - hole.y + GAP }]}
          testID="guide-tour-going"
        >
          <View accessibilityLiveRegion="polite" style={styles.goingPill}>
            <AppText style={[type.heading1, styles.goingText]}>
              {going ? t(`guide.going.${going}`) : ''}
            </AppText>
            <ArrowDownIcon size={14} color={palette.cream} />
          </View>
        </Reveal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  veil: { position: 'absolute', backgroundColor: DIM },
  ring: {
    position: 'absolute',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: palette.cream,
  },
  bubble: { position: 'absolute', left: EDGE, right: EDGE },
  card: {
    backgroundColor: palette.base,
    borderRadius: 20,
    padding: 18,
    gap: 8,
    ...shadow.raised,
  },
  arrow: {
    position: 'absolute',
    width: ARROW,
    height: ARROW,
    backgroundColor: palette.base,
    transform: [{ rotate: '45deg' }],
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  section: { fontSize: 10, lineHeight: 14, letterSpacing: 1.4, color: palette.bronze },
  progress: { fontSize: 10, lineHeight: 14, letterSpacing: 1.4, color: palette.sage },
  goingWrap: { position: 'absolute', left: EDGE, right: EDGE, alignItems: 'center' },
  goingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: palette.base,
    ...shadow.raised,
  },
  goingText: { fontSize: 15, lineHeight: 19, letterSpacing: 0, color: palette.cream },
  skip: { paddingVertical: 2 },
  skipLabel: { fontSize: 14, lineHeight: 18, letterSpacing: 0, color: palette.secondaryText },
  title: { fontSize: 19, lineHeight: 24, letterSpacing: -0.38, color: palette.cream },
  body: { fontSize: 14, lineHeight: 21, color: palette.secondaryText },
  footer: {
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(237,234,224,0.24)' },
  dotOn: { width: 18, backgroundColor: palette.bronze },
  next: {
    flexDirection: 'row',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: palette.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextLabel: { fontSize: 14, lineHeight: 18, letterSpacing: 0, color: palette.base },
  pressed: { opacity: 0.72 },
});
