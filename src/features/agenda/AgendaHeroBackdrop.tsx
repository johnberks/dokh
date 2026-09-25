import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import { palette } from '@/theme/tokens';

/**
 * Manchas do topo escuro da Agenda (01–05 e 15). O HTML usa `filter: blur(...)`; aqui, como
 * no onboarding, gradientes radiais que o Hermes desenha sem filtros SVG.
 */
const BLOBS = [
  { id: 'agenda-right', cx: 360, cy: 110, r: 210, color: palette.structure, opacity: 0.7 },
  { id: 'agenda-left', cx: 30, cy: 190, r: 160, color: palette.authHeroShade, opacity: 1 },
] as const;

export function AgendaHeroBackdrop() {
  return (
    <View style={styles.backdrop} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 390 260" preserveAspectRatio="xMidYMin slice">
        <Defs>
          {BLOBS.map((blob) => (
            <RadialGradient key={blob.id} id={blob.id} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={blob.color} stopOpacity={blob.opacity} />
              <Stop offset="0.55" stopColor={blob.color} stopOpacity={blob.opacity * 0.55} />
              <Stop offset="1" stopColor={blob.color} stopOpacity={0} />
            </RadialGradient>
          ))}
        </Defs>
        {BLOBS.map((blob) => (
          <Ellipse
            key={blob.id}
            cx={blob.cx}
            cy={blob.cy}
            rx={blob.r}
            ry={blob.r}
            fill={`url(#${blob.id})`}
          />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
});
