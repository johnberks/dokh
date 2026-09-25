import { motionDuration } from './motion';
import { motion } from './tokens';

describe('motion policy', () => {
  it.each(['heroPage', 'heroBar', 'reviewRemoval'] as const)(
    '%s uses the design duration or snaps for reduced motion',
    (event) => {
      expect(motionDuration(event, false)).toBe(motion[event]);
      expect(motionDuration(event, true)).toBe(0);
    },
  );
});
