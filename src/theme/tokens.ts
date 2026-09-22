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

/** Brand family names (Brand Kit) and concrete expo-font registration names. */
export const fontFamilies = {
  interface: 'Archivo',
  technical: 'IBM Plex Mono',
  wordmark: 'Unbounded',
  fallback: 'System',
} as const;

export const fontAliases = {
  archivoRegular: 'Archivo_400Regular',
  archivoMedium: 'Archivo_500Medium',
  archivoSemibold: 'Archivo_600SemiBold',
  archivoBold: 'Archivo_700Bold',
  plexRegular: 'IBMPlexMono_400Regular',
  plexMedium: 'IBMPlexMono_500Medium',
  unboundedSemibold: 'Unbounded_600SemiBold',
} as const;

export const fontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

/** Safe fallback styles while font assets are loading or if they fail. */
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

/** Each registered alias is a font file with the specified weight; avoid synthetic bold. */
export const brandTypography = {
  display: { ...typography.display, fontFamily: fontAliases.archivoSemibold },
  heading1: { ...typography.heading1, fontFamily: fontAliases.archivoSemibold },
  heading2: { ...typography.heading2, fontFamily: fontAliases.archivoMedium },
  body: { ...typography.body, fontFamily: fontAliases.archivoRegular },
  label: { ...typography.label, fontFamily: fontAliases.archivoSemibold },
  technical: { ...typography.technical, fontFamily: fontAliases.plexRegular },
  wordmark: { ...typography.wordmark, fontFamily: fontAliases.unboundedSemibold },
} as const;

export function getTypography(fontsLoaded: boolean) {
  return fontsLoaded ? brandTypography : typography;
}

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
