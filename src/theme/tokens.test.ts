import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  colors,
  fontFamilies,
  motion,
  palette,
  radius,
  shadow,
  spacing,
  typography,
  zIndex,
} from './tokens';

describe('Brand Kit tokens', () => {
  it('preserves the approved palette and semantic usage', () => {
    expect(palette.base).toBe('#10160F');
    expect(palette.cream).toBe('#EDEAE0');
    expect(palette.bronze).toBe('#A98A54');
    expect(colors.background).toBe(palette.cream);
    expect(colors.textPrimary).toBe(palette.base);
    expect(colors.errorTextOnDark).toBe(palette.negativeText);
    expect(colors.pendingText).not.toBe(palette.negative);
  });

  it('reserves wordmark type and keeps runtime fonts on fallback until 2.2', () => {
    expect(fontFamilies.wordmark).toBe('Unbounded');
    expect(fontFamilies.technical).toBe('IBM Plex Mono');
    expect(typography.wordmark.fontFamily).toBe(fontFamilies.fallback);
    expect(typography.body.fontFamily).toBe(fontFamilies.fallback);
  });

  it('offers dimension, shadow, motion and layer scales', () => {
    expect(spacing.base).toBe(16);
    expect(radius.card).toBe(22);
    expect(shadow.raised.shadowColor).toBe(palette.base);
    expect(motion.feedback).toBe(200);
    expect(zIndex.overlay).toBeGreaterThan(zIndex.floating);
  });

  it('keeps demonstration components free of inline hex and font families', () => {
    const source = readFileSync(join(__dirname, '../components/PlaceholderScreen.tsx'), 'utf8');
    expect(source).not.toMatch(/#[\da-f]{3,8}\b/i);
    expect(source).not.toMatch(/fontFamily\s*:/);
  });
});
