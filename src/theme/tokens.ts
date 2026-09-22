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
  mutedCopy: '#4A5744',
  bronzeDeep: '#8A6E3C',
  attention: '#E4D9C2',
  previewPaper: '#FDFCF8',
  workSage: '#6F7E67',
  workBlue: '#6B7F8E',
  workTerra: '#8C6A5A',
  workViolet: '#6E6A8A',
} as const;

/** Semantic intent is preferred to raw palette names in components. */
export const colors = {
  background: palette.cream,
  surface: palette.paper,
  foreground: palette.base,
  textPrimary: palette.base,
  textSecondary: palette.structure,
  textMuted: palette.mutedCopy,
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
  tabBarBorder: 'rgba(16,22,15,0.1)',
  tabActiveBackground: 'rgba(16,22,15,0.08)',
  navigationControlBorder: 'rgba(16,22,15,0.2)',
  reviewBorder: 'rgba(16,22,15,0.16)',
  reviewDivider: 'rgba(16,22,15,0.1)',
  reviewTray: 'rgba(16,22,15,0.045)',
  reviewPreviewBorder: 'rgba(16,22,15,0.08)',
  reviewIconBronzeBackground: 'rgba(169,138,84,0.16)',
  reviewIconSageBackground: 'rgba(111,126,103,0.16)',
  reviewAttentionBackground: palette.attention,
  reviewAttentionBorder: 'rgba(169,138,84,0.45)',
  reviewAttentionDivider: 'rgba(169,138,84,0.4)',
  reviewAttentionIconBackground: 'rgba(255,255,255,0.5)',
  reviewPreviewSurface: palette.previewPaper,
  reviewBronzeText: palette.bronzeDeep,
  workCardBorder: 'rgba(16,22,15,0.16)',
  workCardDivider: 'rgba(16,22,15,0.08)',
  workRowSurface: palette.previewPaper,
  receivableLine: 'rgba(16,22,15,0.12)',
  receivableReceivedDay: '#8A9184',
  receivableReceivedFill: 'rgba(43,58,36,0.10)',
  receivablePendingFill: 'rgba(169,138,84,0.16)',
  receivablePendingBorder: 'rgba(169,138,84,0.45)',
  receivablePendingDivider: 'rgba(169,138,84,0.35)',
  emptyOutline: 'rgba(16,22,15,0.22)',
  emptyDashedOutline: 'rgba(16,22,15,0.24)',
  emptyTeaserOutline: 'rgba(16,22,15,0.25)',
  emptyFutureDot: 'rgba(127,138,118,0.95)',
  progressSurface: '#DCE0D6',
  progressBorder: 'rgba(16,22,15,0.1)',
  progressTrack: 'rgba(16,22,15,0.14)',
  progressTray: 'rgba(255,255,255,0.42)',
  progressActionBorder: 'rgba(16,22,15,0.08)',
  progressPendingCircleBorder: 'rgba(16,22,15,0.3)',
  progressFooterBorder: 'rgba(16,22,15,0.12)',
  moneyFieldBorder: 'rgba(16,22,15,0.2)',
} as const;

/** Location color tokens shown in Agenda 13 and used by Agenda/Home cards. */
export const workLocationColors = {
  sage: palette.workSage,
  bronze: palette.bronze,
  blue: palette.workBlue,
  green: palette.structure,
  terra: palette.workTerra,
  violet: palette.workViolet,
} as const;

export type WorkLocationColorToken = keyof typeof workLocationColors;

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
  plexSemibold: 'IBMPlexMono_600SemiBold',
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
  modalTitle: {
    fontFamily: fontFamilies.fallback,
    fontSize: 30,
    lineHeight: 32,
    fontWeight: fontWeights.semibold,
    letterSpacing: -0.9,
  },
  modalDescription: {
    fontFamily: fontFamilies.fallback,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: fontWeights.regular,
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
  tabLabel: {
    fontFamily: fontFamilies.fallback,
    fontSize: 9,
    lineHeight: 12,
    fontWeight: fontWeights.regular,
    letterSpacing: 1.08,
  },
  tabLabelActive: {
    fontFamily: fontFamilies.fallback,
    fontSize: 9,
    lineHeight: 12,
    fontWeight: fontWeights.semibold,
    letterSpacing: 1.08,
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
  modalTitle: { ...typography.modalTitle, fontFamily: fontAliases.archivoSemibold },
  modalDescription: { ...typography.modalDescription, fontFamily: fontAliases.archivoRegular },
  body: { ...typography.body, fontFamily: fontAliases.archivoRegular },
  label: { ...typography.label, fontFamily: fontAliases.archivoSemibold },
  technical: { ...typography.technical, fontFamily: fontAliases.plexRegular },
  tabLabel: { ...typography.tabLabel, fontFamily: fontAliases.plexRegular },
  tabLabelActive: { ...typography.tabLabelActive, fontFamily: fontAliases.plexSemibold },
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

/** Exact shared tab/navigation geometry from the 390×844 HTML frames. */
export const navigationMetrics = {
  tabBarTop: 10,
  tabBarHorizontal: 20,
  tabBarBottom: 28,
  tabWidth: 64,
  tabIconSize: 22,
  tabIconStroke: 1.7,
  tabIconBoxWidth: 40,
  tabIconBoxHeight: 30,
  tabIconRadius: 10,
  tabLabelGap: 4,
  createDiameter: 56,
  createLift: 30,
  createIconSize: 18,
  createIconStroke: 2,
  navigationControlDiameter: 40,
  navigationControlHitTarget: 44,
  navigationControlIconSize: 20,
  modalTop: 20,
  modalHorizontal: 24,
  modalHeadingGap: 24,
  modalDescriptionGap: 6,
} as const;

/** Review Card sizes extracted from design/componentes.dc.html, variants A–D. */
export const reviewCardMetrics = {
  compactRadius: 18,
  regularRadius: 22,
  compactPaddingTop: 14,
  compactPaddingHorizontal: 14,
  compactPaddingLeft: 16,
  regularPaddingHorizontal: 18,
  regularPaddingTop: 16,
  detailedPaddingTop: 18,
  compactIconTile: 34,
  regularIconTile: 30,
  detailedIconTile: 34,
  compactActionCircle: 32,
  regularActionCircle: 32,
  detailedActionCircle: 34,
  trayRadius: 16,
  trayPadding: 6,
  previewRadius: 12,
  previewBarWidth: 5,
  previewBarHeight: 28,
} as const;

/** Card and compact row geometry from Agenda 02/03/05 and Home 01/03. */
export const workCardMetrics = {
  radius: 22,
  agendaPaddingTop: 18,
  agendaPaddingRight: 20,
  agendaPaddingBottom: 16,
  agendaPaddingLeft: 26,
  agendaBarWidth: 4,
  agendaBarInset: 20,
  agendaArrow: 30,
  featuredPaddingHorizontal: 22,
  featuredPaddingTop: 22,
  featuredPaddingBottom: 20,
  featuredArrow: 32,
  rowRadius: 12,
  rowBarWidth: 5,
  rowBarHeight: 34,
  rowDateWidth: 34,
} as const;

/** Finanças 05–10: timeline row, status and confirmation geometry. */
export const receivableRowMetrics = {
  dateWidth: 44,
  timelineWidth: 1,
  dotDiameter: 10,
  dotTop: 8,
  gap: 16,
  bodyRadius: 18,
  pendingPaddingVertical: 14,
  pendingPaddingHorizontal: 16,
  regularBottomGap: 22,
  pendingBottomGap: 18,
  confirmCircle: 34,
  confirmHitTarget: 44,
} as const;

/** Empty-state geometries from Home 05–06, Agenda 04, Finanças 11/14 and Perfil. */
export const emptyStateMetrics = {
  cardRadius: 22,
  agendaPaddingVertical: 26,
  agendaPaddingHorizontal: 22,
  profileButtonHeight: 56,
  profileButtonRadius: 16,
  compactButtonHeight: 40,
  compactButtonRadius: 12,
  actionHitTarget: 44,
  entriesHorizontalInset: 32,
  profileBottomInset: 80,
  importBottomInset: 40,
} as const;

/** Home 01/02/06 setup progress card geometry. */
export const progressCardMetrics = {
  radius: 22,
  paddingHorizontal: 16,
  paddingTop: 16,
  gap: 12,
  progressHeight: 4,
  trayRadius: 16,
  trayPadding: 6,
  rowGap: 4,
  completedCircle: 20,
  actionCircle: 28,
  actionRadius: 12,
  actionMinHeight: 44,
} as const;

/** Money entry geometry from Agenda 06/09 and Onboarding 05/09. */
export const moneyInputMetrics = {
  formHeight: 60,
  formRadius: 16,
  formPaddingHorizontal: 18,
  formLabelSize: 9,
  formValueSize: 16,
  residencyCurrencySize: 20,
  residencyValueSize: 44,
  workCurrencySize: 22,
  workValueSize: 48,
  heroUnderlineWidth: 1.5,
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
  tabCreate: {
    shadowColor: palette.base,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
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
