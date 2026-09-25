import Svg, { Rect } from 'react-native-svg';
import { palette } from '@/theme/tokens';

export type BrandMarkProps = {
  /** `light` inverte a superfície frontal para fundo escuro (splash 00B). */
  light?: boolean;
  size?: number;
};

/**
 * Símbolo DOKH do Brand Kit: duas superfícies deslocadas em 30 e a interseção bronze.
 * O vetor D1 final de produção ainda não foi entregue (pendência da 2.2).
 */
export function BrandMark({ light = false, size = 40 }: BrandMarkProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" accessibilityElementsHidden>
      <Rect
        x={14}
        y={14}
        width={62}
        height={62}
        rx={10}
        fill={light ? palette.cream : palette.base}
      />
      <Rect x={44} y={44} width={62} height={62} rx={10} fill={palette.sage} />
      <Rect x={44} y={44} width={32} height={32} fill={palette.bronze} />
    </Svg>
  );
}
