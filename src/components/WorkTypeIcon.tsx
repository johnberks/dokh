import Svg, { Circle, Path, Rect } from 'react-native-svg';
import type { WorkType } from '@/domain/work-type';
import { colors, palette, workTypeSelectorMetrics } from '@/theme/tokens';

/** Traços e cores exatos de Onboarding 06 / Agenda 06B (viewBox 24). */
export const workTypeTone: Record<WorkType, { stroke: string; tile: string }> = {
  shift: { stroke: palette.structure, tile: colors.workTypeShiftTile },
  procedure: { stroke: palette.bronzeDeep, tile: colors.workTypeProcedureTile },
  appointment: { stroke: palette.workBlueDeep, tile: colors.workTypeAppointmentTile },
};

type Props = { type: WorkType; size?: number };

/** Ícone decorativo: o nome do tipo sempre acompanha em texto. */
export function WorkTypeIcon({ type, size = workTypeSelectorMetrics.iconSize }: Props) {
  const stroke = workTypeTone[type].stroke;
  const common = {
    fill: 'none',
    stroke,
    strokeWidth: workTypeSelectorMetrics.iconStroke,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  } as const;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      {type === 'shift' && (
        <>
          <Circle cx={12} cy={12} r={9} {...common} />
          <Path d="M12 7v5l3.5 2" {...common} />
        </>
      )}
      {type === 'procedure' && (
        <>
          <Path d="M8 4 6 6l8 8 2-2z" {...common} />
          <Path d="M14 10l6 6-2 2-6-6z" {...common} />
          <Circle cx={6.5} cy={17.5} r={2.5} {...common} />
        </>
      )}
      {type === 'appointment' && (
        <>
          <Rect x={4} y={5.5} width={16} height={14.5} rx={2.5} {...common} />
          <Path d="M4 10h16M8 3.5v4M16 3.5v4" {...common} />
          <Path d="M8 14h3M8 17h5" {...common} />
        </>
      )}
    </Svg>
  );
}
