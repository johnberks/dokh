import { motion } from './tokens';

export type MotionEvent = 'heroPage' | 'heroBar' | 'reviewRemoval';

/** D11: every non-essential transition snaps immediately when reduced motion is enabled. */
export function motionDuration(event: MotionEvent, reduced: boolean): number {
  return reduced ? motion.instant : motion[event];
}
