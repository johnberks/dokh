import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { Reveal } from '@/components/Reveal';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { palette, shadow } from '@/theme/tokens';
import {
  currentTourStep,
  TOUR_STEPS,
  type TourRect,
  type TourTab,
  useGuideTour,
} from './guide-tour';
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
 */
export function GuideTourOverlay() {
  const { t } = useTranslation('navigation');
  const type = useBrandTypography();
  const insets = useSafeAreaInsets();
  const window = useWindowDimensions();
  const index = useGuideTour((state) => state.step);
  const rects = useGuideTour((state) => state.rects);
  const next = useGuideTour((state) => state.next);
  const finish = useGuideTour((state) => state.finish);
  const [bubbleHeight, setBubbleHeight] = useState(0);
  const [fallback, setFallback] = useState(false);
  const step = currentTourStep(index);
  const tab = step?.tab;

  // Cada passo abre a aba dele; o alvo se mede depois que a aba assenta.
  useEffect(() => {
    if (!tab) return;
    router.navigate(TAB_HREF[tab]);
  }, [tab]);

  useEffect(() => {
    setFallback(false);
    if (index === null) return;
    const timer = setTimeout(() => setFallback(true), FALLBACK_DELAY);
    return () => clearTimeout(timer);
  }, [index]);

  if (!step || index === null) return null;
  const rect: TourRect | undefined = rects[step.target];
  if (!rect && !fallback) {
    // Enquanto a aba troca, só o véu: nada de balão apontando para o lugar errado.
    return <View pointerEvents="auto" style={[StyleSheet.absoluteFill, styles.veil]} />;
  }

  const last = index === TOUR_STEPS.length - 1;
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
    next();
  }

  return (
    <View style={StyleSheet.absoluteFill} testID="guide-tour">
      {hole ? (
        <>
          {/* Quatro faixas escuras em volta do recorte: o alvo fica aceso e visível. */}
          <View style={[styles.veil, { top: 0, left: 0, right: 0, height: Math.max(0, hole.y) }]} />
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
            key={`ring-${index}`}
            rise={0}
            scaleFrom={1.06}
            style={[
              styles.ring,
              { top: hole.y, left: hole.x, width: hole.width, height: hole.height },
            ]}
          />
        </>
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.veil]} />
      )}

      <Reveal
        key={`bubble-${index}`}
        rise={below ? -10 : 10}
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
            <AppText variant="technical" style={styles.progress}>
              {t('guide.progress', { current: index + 1, total: TOUR_STEPS.length })}
            </AppText>
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
              {TOUR_STEPS.map((item, dot) => (
                <View key={item.key} style={[styles.dot, dot === index && styles.dotOn]} />
              ))}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={last ? t('guide.done') : t('guide.next')}
              onPress={advance}
              testID="guide-tour-next"
              style={({ pressed }) => [styles.next, pressed && styles.pressed]}
            >
              <AppText style={[type.heading1, styles.nextLabel]}>
                {last ? t('guide.done') : t('guide.next')}
              </AppText>
            </Pressable>
          </View>
        </View>
      </Reveal>
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
  progress: { fontSize: 10, lineHeight: 14, letterSpacing: 1.4, color: palette.sage },
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
