import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  brandTypography,
  colors,
  emptyStateMetrics,
  fontAliases,
  fontFamilies,
  getTypography,
  motion,
  navigationMetrics,
  palette,
  radius,
  receivableRowMetrics,
  reviewCardMetrics,
  shadow,
  spacing,
  typography,
  workCardMetrics,
  workLocationColors,
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
    expect(palette.attention).toBe('#E4D9C2');
    expect(colors.reviewAttentionBackground).toBe(palette.attention);
    expect(colors.reviewPreviewSurface).toBe('#FDFCF8');
  });

  it('registers each brand role and provides a safe fallback', () => {
    expect(fontFamilies.wordmark).toBe('Unbounded');
    expect(fontFamilies.technical).toBe('IBM Plex Mono');
    expect(getTypography(true)).toBe(brandTypography);
    expect(getTypography(false)).toBe(typography);
    expect(brandTypography.wordmark.fontFamily).toBe(fontAliases.unboundedSemibold);
    expect(brandTypography.body.fontFamily).toBe(fontAliases.archivoRegular);
    expect(brandTypography.technical.fontFamily).toBe(fontAliases.plexRegular);
    expect(brandTypography.tabLabelActive.fontFamily).toBe(fontAliases.plexSemibold);
    expect(brandTypography.tabLabel.fontSize).toBe(9);
    expect(typography.body.fontFamily).toBe(fontFamilies.fallback);
  });

  it('offers dimension, shadow, motion and layer scales', () => {
    expect(spacing.base).toBe(16);
    expect(radius.card).toBe(22);
    expect(shadow.raised.shadowColor).toBe(palette.base);
    expect(motion.feedback).toBe(200);
    expect(zIndex.overlay).toBeGreaterThan(zIndex.floating);
    expect(navigationMetrics.createDiameter).toBe(56);
    expect(navigationMetrics.navigationControlHitTarget).toBeGreaterThanOrEqual(44);
    expect(reviewCardMetrics.compactRadius).toBe(18);
    expect(reviewCardMetrics.regularRadius).toBe(22);
    expect(reviewCardMetrics.previewBarWidth).toBe(5);
    expect(workCardMetrics.agendaBarWidth).toBe(4);
    expect(workCardMetrics.rowBarHeight).toBe(34);
    expect(workLocationColors.sage).toBe('#6F7E67');
    expect(workLocationColors.blue).toBe('#6B7F8E');
    expect(receivableRowMetrics.confirmCircle).toBe(34);
    expect(receivableRowMetrics.confirmHitTarget).toBeGreaterThanOrEqual(44);
    expect(emptyStateMetrics.cardRadius).toBe(22);
    expect(emptyStateMetrics.profileButtonHeight).toBe(56);
    expect(colors.emptyOutline).toBe('rgba(16,22,15,0.22)');
  });

  it('keeps demonstration components free of inline hex and font families', () => {
    const source = readFileSync(join(__dirname, '../components/PlaceholderScreen.tsx'), 'utf8');
    expect(source).not.toMatch(/#[\da-f]{3,8}\b/i);
    expect(source).not.toMatch(/fontFamily\s*:/);
  });
});
