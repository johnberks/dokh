import type { WorkType } from '@/domain/work-type';
import { colors, palette, workTypeSelectorMetrics } from '@/theme/tokens';
import { ClipboardDocumentListIcon, ClockIcon, EyeDropperIcon } from './icons/heroicons';

/** Cores de Onboarding 06 / Agenda 06B; o desenho vem da Heroicons Solid. */
export const workTypeTone: Record<WorkType, { stroke: string; tile: string }> = {
  shift: { stroke: palette.structure, tile: colors.workTypeShiftTile },
  procedure: { stroke: palette.bronzeDeep, tile: colors.workTypeProcedureTile },
  appointment: { stroke: palette.workBlueDeep, tile: colors.workTypeAppointmentTile },
};

type Props = { type: WorkType; size?: number };

/** Ícone decorativo (Heroicons Solid): o nome do tipo sempre acompanha em texto. */
const ICONS = {
  shift: ClockIcon,
  procedure: EyeDropperIcon,
  appointment: ClipboardDocumentListIcon,
} as const;

export function WorkTypeIcon({ type, size = workTypeSelectorMetrics.iconSize }: Props) {
  const Icon = ICONS[type];
  return <Icon size={size} color={workTypeTone[type].stroke} />;
}
