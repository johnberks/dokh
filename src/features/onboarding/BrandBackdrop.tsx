import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import { palette } from '@/theme/tokens';

/**
 * Manchas de luz das telas escuras do onboarding (00B, 06, 12 e TELA 10 de `design/onboarding.html`).
 * O HTML usa `filter: blur(...)` em quadrados; em React Native a borda suave vem de
 * gradientes radiais, que o Hermes desenha sem depender de filtros SVG.
 * Medidas em pontos sobre a moldura de 390×844 do design.
 */
export type BrandBackdropVariant = 'splash' | 'intro' | 'ready' | 'done';

type Blob = {
  id: string;
  /** Centro e raios em pontos do design. */
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  color: string;
  opacity: number;
};

const BLOBS: Record<BrandBackdropVariant, readonly Blob[]> = {
  // 00B: mancha à esquerda, massa verde abaixo e núcleo sálvia.
  splash: [
    { id: 'left', cx: 50, cy: 310, rx: 220, ry: 220, color: palette.authHeroShade, opacity: 1 },
    { id: 'lower', cx: 290, cy: 550, rx: 230, ry: 230, color: palette.structure, opacity: 0.85 },
    { id: 'core', cx: 205, cy: 465, rx: 130, ry: 130, color: palette.workSage, opacity: 0.5 },
  ],
  intro: [
    { id: 'left', cx: 50, cy: 290, rx: 230, ry: 230, color: palette.authHeroShade, opacity: 1 },
    { id: 'lower', cx: 310, cy: 470, rx: 230, ry: 230, color: palette.structure, opacity: 0.85 },
    { id: 'core', cx: 225, cy: 385, rx: 130, ry: 130, color: palette.workSage, opacity: 0.5 },
  ],
  // 12: massa verde no topo direito, verde escuro à esquerda e brilho bronze no centro.
  ready: [
    { id: 'top', cx: 430, cy: 140, rx: 245, ry: 245, color: palette.structure, opacity: 0.8 },
    { id: 'left', cx: 80, cy: 360, rx: 195, ry: 195, color: palette.authHeroShade, opacity: 1 },
    { id: 'glow', cx: 160, cy: 240, rx: 130, ry: 130, color: palette.bronze, opacity: 0.22 },
  ],
  // TELA 10: verde à esquerda, sombra à direita, núcleo sálvia e brilho bronze sobre o total.
  done: [
    { id: 'left', cx: 50, cy: 250, rx: 230, ry: 230, color: palette.structure, opacity: 0.85 },
    { id: 'right', cx: 330, cy: 460, rx: 210, ry: 210, color: palette.authHeroShade, opacity: 1 },
    { id: 'core', cx: 220, cy: 270, rx: 110, ry: 110, color: palette.workSage, opacity: 0.4 },
    { id: 'glow', cx: 245, cy: 155, rx: 70, ry: 70, color: palette.bronze, opacity: 0.35 },
  ],
};

const FRAME = { width: 390, height: 844 };

export function BrandBackdrop({ variant }: { variant: BrandBackdropVariant }) {
  return (
    <View style={styles.backdrop} pointerEvents="none" testID={`brand-backdrop-${variant}`}>
      <Svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${FRAME.width} ${FRAME.height}`}
        preserveAspectRatio="xMidYMid slice"
      >
        <Defs>
          {BLOBS[variant].map((blob) => (
            <RadialGradient key={blob.id} id={blob.id} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={blob.color} stopOpacity={blob.opacity} />
              <Stop offset="0.55" stopColor={blob.color} stopOpacity={blob.opacity * 0.55} />
              <Stop offset="1" stopColor={blob.color} stopOpacity={0} />
            </RadialGradient>
          ))}
        </Defs>
        {BLOBS[variant].map((blob) => (
          <Ellipse
            key={blob.id}
            cx={blob.cx}
            cy={blob.cy}
            rx={blob.rx}
            ry={blob.ry}
            fill={`url(#${blob.id})`}
          />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: palette.base,
  },
});
