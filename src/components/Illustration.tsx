import type { ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { illustration as c } from '@/theme/tokens';

export type IllustrationName =
  | 'emptyAgenda'
  | 'firstEntry'
  | 'emptyWallet'
  | 'nextShift'
  | 'emptyStatement'
  | 'allClear'
  | 'paymentPending'
  | 'offline'
  | 'error'
  | 'premium';

/** Sombra no chão: só nos estados vazios/erro; dentro de cards compactos ela sai (`ground`). */
function Ground({ wide = false }: { wide?: boolean }) {
  return <Ellipse cx={80} cy={104} rx={wide ? 56 : 50} ry={5} fill={c.shade} stroke="none" />;
}

/**
 * As dez ilustrações de `DOKH Ilustracoes.dc.html`, traço a traço (viewBox 160×120).
 * Cada uma recebe `ground` para mostrar ou não a sombra no chão.
 */
const ART: Record<IllustrationName, (ground: boolean) => ReactNode> = {
  // 01 · Agenda sem plantões
  emptyAgenda: (ground) => (
    <>
      {ground && <Ground />}
      <Rect x={42} y={32} width={72} height={64} rx={9} fill={c.paper} />
      <Path d="M42 50 h72" />
      <Path d="M60 26 v12 M96 26 v12" />
      {[
        [54, 60],
        [73, 60],
        [92, 60],
        [54, 76],
        [73, 76],
      ].map(([x, y]) => (
        <Rect
          key={`${x}-${y}`}
          x={x}
          y={y}
          width={10}
          height={10}
          rx={2.5}
          strokeDasharray="3 3"
          strokeWidth={1.5}
        />
      ))}
      <Circle cx={116} cy={32} r={13} fill={c.gold} />
      <Circle cx={122} cy={27} r={10} fill={c.paper} stroke="none" />
      <Path d="M34 30 v6 M31 33 h6" stroke={c.gold} />
    </>
  ),
  // 02 · Primeira entrada
  firstEntry: (ground) => (
    <>
      {ground && <Ground />}
      <Path d="M44 22 v20 a15 15 0 0 0 30 0 v-20" />
      <Circle cx={44} cy={20} r={3} fill={c.ink} />
      <Circle cx={74} cy={20} r={3} fill={c.ink} />
      <Path d="M59 57 v14 a16 16 0 0 0 16 16 h5" />
      <Circle cx={104} cy={74} r={24} fill={c.gold} />
      <Circle cx={104} cy={74} r={16} strokeWidth={1.5} />
      <Path d="M104 66 v16 M96 74 h16" />
      {ground && <Path d="M128 38 l3 -7 M134 46 l7 -3" stroke={c.gold} />}
    </>
  ),
  // 03 · Carteira vazia
  emptyWallet: (ground) => (
    <>
      {ground && <Ground />}
      <Path d="M44 44 l52 -14 l6 14" fill={c.shade} />
      <Rect x={36} y={44} width={88} height={54} rx={10} fill={c.paper} />
      <Rect x={94} y={60} width={34} height={22} rx={7} fill={c.shade} />
      <Circle cx={106} cy={71} r={3.5} fill={c.ink} />
      <Circle cx={66} cy={24} r={9} stroke={c.gold} strokeDasharray="3 3.5" />
      <Path d="M52 62 h22" strokeWidth={1.5} strokeDasharray="3 4" />
    </>
  ),
  // 04 · Próximo plantão
  nextShift: (ground) => (
    <>
      {ground && <Ground />}
      <Rect x={44} y={36} width={60} height={62} rx={4} fill={c.paper} />
      {[
        [54, 50],
        [70, 50],
        [54, 66],
        [70, 66],
      ].map(([x, y]) => (
        <Rect
          key={`${x}-${y}`}
          x={x}
          y={y}
          width={10}
          height={9}
          rx={2}
          fill={c.shade}
          strokeWidth={1.5}
        />
      ))}
      <Path d="M66 98 v-14 h16 v14" />
      <Circle cx={74} cy={36} r={11} fill={c.gold} />
      <Path d="M74 31 v10 M69 36 h10" />
      <Circle cx={112} cy={70} r={16} fill={c.paper} />
      <Path d="M112 61 v9 l6 4" />
    </>
  ),
  // 05 · Extrato sem lançamentos
  emptyStatement: (ground) => (
    <>
      {ground && <Ground />}
      <Path
        d="M48 16 h58 v80 l-7.25 -6 l-7.25 6 l-7.25 -6 l-7.25 6 l-7.25 -6 l-7.25 6 l-7.25 -6 l-7.25 6 z"
        fill={c.paper}
      />
      <Path d="M58 32 h24" strokeWidth={1.5} />
      <Path d="M58 46 h38 M58 58 h38 M58 70 h26" strokeWidth={1.5} strokeDasharray="3 4" />
      <Circle cx={106} cy={72} r={13} fill={c.paper} stroke={c.gold} strokeWidth={4} />
      <Path d="M115.5 81.5 l10 10" stroke={c.gold} strokeWidth={5} />
    </>
  ),
  // 06 · Tudo em dia
  allClear: (ground) => (
    <>
      {ground && <Ground />}
      <Rect x={46} y={24} width={68} height={76} rx={9} fill={c.paper} />
      <Rect x={66} y={17} width={28} height={13} rx={4} fill={c.ink} />
      <Rect x={57} y={42} width={10} height={10} rx={3} />
      <Path d="M59.5 47 l2 2 l4 -4.5" strokeWidth={1.8} />
      <Path d="M74 47 h28" strokeWidth={1.5} />
      <Rect x={57} y={60} width={10} height={10} rx={3} />
      <Path d="M59.5 65 l2 2 l4 -4.5" strokeWidth={1.8} />
      <Path d="M74 65 h22" strokeWidth={1.5} />
      <Rect x={57} y={78} width={10} height={10} rx={3} fill={c.gold} />
      <Path d="M59.5 83 l2 2 l4 -4.5" strokeWidth={1.8} />
      <Path d="M74 83 h26" strokeWidth={1.5} />
      <Path d="M124 30 v8 M120 34 h8 M34 64 v6 M31 67 h6" stroke={c.gold} />
    </>
  ),
  // 07 · Pagamento pendente
  paymentPending: (ground) => (
    <>
      {ground && <Ground />}
      <Path
        d="M62 24 c0 22 18 26 18 36 c0 10 -18 14 -18 36 h36 c0 -22 -18 -26 -18 -36 c0 -10 18 -14 18 -36 z"
        fill={c.paper}
      />
      <Path d="M69 34 h22 l-11 15 z" fill={c.gold} stroke="none" />
      <Path d="M80 54 v22" stroke={c.gold} strokeWidth={2} strokeDasharray="2 4" />
      <Path d="M67 94 c4 -9 9 -13 13 -13 c4 0 9 4 13 13 z" fill={c.gold} stroke="none" />
      <Path d="M54 22 h52 M54 98 h52" />
      <Circle cx={118} cy={44} r={10} fill={c.paper} />
      <Path d="M118 39 v6 M118 49 v0.5" />
    </>
  ),
  // 08 · Sem conexão
  offline: (ground) => (
    <>
      {ground && <Ground wide />}
      <Path d="M18 76 c10 0 14 -6 28 -6" />
      <Rect x={46} y={58} width={22} height={24} rx={6} fill={c.paper} />
      <Path d="M68 64 h9 M68 76 h9" />
      <Rect x={94} y={56} width={24} height={28} rx={6} fill={c.shade} />
      <Path d="M100 64 h3 M100 76 h3" strokeWidth={3} />
      <Path d="M118 70 c10 0 14 8 26 8" />
      <Path d="M88 36 l-6 11 h9 l-6 11" stroke={c.gold} strokeWidth={3} />
    </>
  ),
  // 09 · Algo deu errado
  error: (ground) => (
    <>
      {ground && <Ground />}
      <Rect x={38} y={28} width={84} height={64} rx={9} fill={c.paper} />
      <Path d="M38 42 h84" />
      <Circle cx={47} cy={35} r={1.5} fill={c.ink} />
      <Circle cx={54} cy={35} r={1.5} fill={c.ink} />
      <Path d="M88 42 l-8 14 l10 9 l-8 13 l5 14" strokeWidth={1.8} />
      <G transform="rotate(-28 80 67)">
        <Rect x={52} y={58} width={56} height={18} rx={9} fill={c.gold} />
        <Rect x={70} y={58} width={20} height={18} fill={c.paper} />
        <Circle cx={60} cy={67} r={1.2} fill={c.ink} stroke="none" />
        <Circle cx={100} cy={67} r={1.2} fill={c.ink} stroke="none" />
      </G>
    </>
  ),
  // 10 · Recurso Premium
  premium: (ground) => (
    <>
      {ground && <Ground />}
      <Rect x={30} y={24} width={84} height={64} rx={9} fill={c.paper} />
      <Path d="M42 38 h28" strokeWidth={1.5} />
      <Rect x={44} y={58} width={10} height={20} rx={2} fill={c.shade} stroke="none" />
      <Rect x={60} y={50} width={10} height={28} rx={2} fill={c.shade} stroke="none" />
      <Rect x={76} y={62} width={10} height={16} rx={2} fill={c.shade} stroke="none" />
      <Rect x={92} y={44} width={10} height={34} rx={2} fill={c.shade} stroke="none" />
      <Path d="M104 64 v-9 a12 12 0 0 1 24 0 v9" />
      <Rect x={96} y={62} width={40} height={34} rx={9} fill={c.gold} />
      <Circle cx={116} cy={76} r={4} fill={c.ink} />
      <Path d="M116 79 v7" strokeWidth={3} />
      <Path d="M134 22 v10 M129 27 h10" stroke={c.gold} />
    </>
  ),
};

/**
 * Ilustração decorativa (escondida do leitor de tela: o texto ao lado já diz tudo).
 * Proporção fixa 4:3; `width` de 64 a 200 px, como pede o design.
 */
export function Illustration({
  name,
  width = 160,
  ground = true,
  testID,
}: {
  name: IllustrationName;
  width?: number;
  /** Sombra no chão; em cards compactos o design a remove. */
  ground?: boolean;
  testID?: string;
}) {
  const height = (width * c.viewBoxHeight) / c.viewBoxWidth;
  return (
    <View
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width, height }}
      testID={testID ?? `illustration-${name}`}
    >
      <Svg
        width={width}
        height={height}
        viewBox={`0 0 ${c.viewBoxWidth} ${c.viewBoxHeight}`}
        fill="none"
        stroke={c.ink}
        strokeWidth={c.stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {ART[name](ground)}
      </Svg>
    </View>
  );
}
