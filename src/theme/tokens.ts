/**
 * Brand Kit v1.0: design/brand-kit.dc.html. The light product surfaces and
 * dimensions below follow design/componentes.dc.html; see docs/theme-tokens.md.
 * Values are React Native points (and milliseconds for motion), not CSS pixels.
 */
export const palette = {
  base: '#10160F',
  cream: '#EDEAE0',
  structure: '#2B3A24',
  sage: '#7F8A76',
  bronze: '#A98A54',
  negative: '#9C4A36',
  negativeText: '#C97A62',
  secondaryText: '#9AA391',
  deepBackground: '#0A0E09',
  paper: '#F8F6EF',
} as const;

/** Semantic intent is preferred to raw palette names in components. */
export const colors = {
  background: palette.cream,
  surface: palette.paper,
  foreground: palette.base,
  textPrimary: palette.base,
  textSecondary: palette.structure,
  border: palette.structure,
  accent: palette.bronze,
  darkBackground: palette.base,
  darkSurface: palette.deepBackground,
  darkTextPrimary: palette.cream,
  darkTextSecondary: palette.sage,
  darkBorder: palette.structure,
  errorTextOnDark: palette.negativeText,
  errorFill: palette.negative,
  pendingText: palette.structure,
} as const;

/** Font assets are intentionally not loaded until task 2.2. */
export const fontFamilies = {
  interface: 'Archivo',
  technical: 'IBM Plex Mono',
  wordmark: 'Unbounded',
  fallback: 'System',
} as const;

export const fontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

/** Use fallback in live placeholders until expo-font loads the brand families (2.2). */
export const typography = {
  display: {
    fontFamily: fontFamilies.fallback,
    fontSize: 58,
    lineHeight: 60,
    fontWeight: fontWeights.semibold,
    letterSpacing: -2.32,
  },
  heading1: {
    fontFamily: fontFamilies.fallback,
    fontSize: 34,
    lineHeight: 38,
    fontWeight: fontWeights.semibold,
    letterSpacing: -1.02,
  },
  heading2: {
    fontFamily: fontFamilies.fallback,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: fontWeights.medium,
    letterSpacing: -0.44,
  },
  body: {
    fontFamily: fontFamilies.fallback,
    fontSize: 15,
    lineHeight: 25,
    fontWeight: fontWeights.regular,
  },
  label: {
    fontFamily: fontFamilies.fallback,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: fontWeights.semibold,
    letterSpacing: 1.54,
  },
  technical: {
    fontFamily: fontFamilies.fallback,
    fontSize: 11,
    lineHeight: 18,
    fontWeight: fontWeights.regular,
  },
  wordmark: {
    fontFamily: fontFamilies.fallback,
    fontSize: 22,
    lineHeight: 24,
    fontWeight: fontWeights.semibold,
    letterSpacing: 0.44,
  },
} as const;

export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  section: 48,
} as const;

export const radius = {
  none: 0,
  small: 4,
  icon: 10,
  input: 12,
  inset: 16,
  compactCard: 18,
  card: 22,
  screen: 28,
  pill: 999,
} as const;

/** Neutral-only shadows; RN cannot reproduce the HTML's inset highlight. */
export const shadow = {
  none: {
    shadowColor: palette.base,
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  subtle: {
    shadowColor: palette.base,
    shadowOpacity: 0.08,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  raised: {
    shadowColor: palette.base,
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
} as const;

/** Durations only: reduce-motion handling and Reanimated presets belong to 2.7. */
export const motion = {
  instant: 0,
  feedback: 200,
  enter: 250,
  exit: 200,
} as const;

/** Relative stacking within one RN view hierarchy; modal navigation owns its own layer. */
export const zIndex = {
  base: 0,
  content: 1,
  sticky: 10,
  floating: 20,
  overlay: 30,
} as const;
