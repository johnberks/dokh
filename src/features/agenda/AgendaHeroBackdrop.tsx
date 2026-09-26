import { StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { palette } from '@/theme/tokens';

/**
 * Manchas do topo escuro (Agenda, Finanças e detalhe). O HTML usa `filter: blur(...)`; aqui,
 * gradientes radiais em coordenadas absolutas pintados sobre um retângulo que cobre todo o
 * topo — sem elipse, não há borda que apareça, e o tom fica contínuo até a barra de status.
 */
const BLOBS = [
  { id: 'agenda-left', cx: 30, cy: 190, r: 200, color: palette.authHeroShade, opacity: 1 },
  { id: 'agenda-right', cx: 360, cy: 110, r: 260, color: palette.structure, opacity: 0.7 },
] as const;

const W = 390;
const H = 260;

export function AgendaHeroBackdrop() {
  return (
    <View style={[styles.backdrop]} pointerEvents="none" testID="agenda-hero-backdrop">
      <Svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMin slice"
      >
        <Defs>
          {BLOBS.map((blob) => (
            <RadialGradient
              key={blob.id}
              id={blob.id}
              gradientUnits="userSpaceOnUse"
              cx={blob.cx}
              cy={blob.cy}
              fx={blob.cx}
              fy={blob.cy}
              r={blob.r}
            >
              <Stop offset="0" stopColor={blob.color} stopOpacity={blob.opacity} />
              <Stop offset="0.45" stopColor={blob.color} stopOpacity={blob.opacity * 0.6} />
              <Stop offset="0.8" stopColor={blob.color} stopOpacity={blob.opacity * 0.15} />
              <Stop offset="1" stopColor={blob.color} stopOpacity={0} />
            </RadialGradient>
          ))}
        </Defs>
        {BLOBS.map((blob) => (
          <Rect key={blob.id} x={0} y={0} width={W} height={H} fill={`url(#${blob.id})`} />
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
