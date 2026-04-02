import { Platform } from 'react-native';

export const typography = {
  fontFamily: Platform.select({
    ios: 'Inter', // Prefer Inter if available
    android: 'Roboto',
    default: 'System',
  }),
  fontWeights: {
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
    extraBold: '800' as const,
  },
  sizes: {
    '2xs': 10,
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
    '6xl': 64,
  },
  lineHeights: {
    none: 1,
    tight: 1.1,
    snug: 1.25,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
  letterSpacing: {
    tighter: -1.2,
    tight: -0.6,
    snug: -0.2,
    normal: 0,
    wide: 0.4,
    wider: 0.8,
    widest: 1.6,
  },
};

export const createTextStyle = (
  size: keyof typeof typography.sizes,
  weight: keyof typeof typography.fontWeights = 'regular',
  lineHeight: keyof typeof typography.lineHeights = 'normal',
) => ({
  fontFamily: typography.fontFamily,
  fontSize: typography.sizes[size],
  fontWeight: typography.fontWeights[weight],
  lineHeight: Math.round(typography.sizes[size] * typography.lineHeights[lineHeight]),
});

// Common text styles
export const textStyles = {
  // Headers (Snappy & Impactful)
  h1: {
    ...createTextStyle('6xl', 'extraBold', 'tight'),
    letterSpacing: typography.letterSpacing.tighter,
  },
  h2: {
    ...createTextStyle('5xl', 'extraBold', 'tight'),
    letterSpacing: typography.letterSpacing.tighter,
  },
  h3: {
    ...createTextStyle('4xl', 'bold', 'snug'),
    letterSpacing: typography.letterSpacing.tight,
  },
  h4: {
    ...createTextStyle('3xl', 'bold', 'snug'),
    letterSpacing: typography.letterSpacing.tight,
  },
  h5: {
    ...createTextStyle('2xl', 'semiBold', 'snug'),
    letterSpacing: typography.letterSpacing.snug,
  },
  h6: {
    ...createTextStyle('xl', 'semiBold', 'normal'),
    letterSpacing: typography.letterSpacing.snug,
  },

  // Body text (Readable & Precise)
  bodyLarge: {
    ...createTextStyle('lg', 'regular', 'relaxed'),
    letterSpacing: typography.letterSpacing.normal,
  },
  bodyMedium: {
    ...createTextStyle('md', 'regular', 'relaxed'),
    letterSpacing: typography.letterSpacing.normal,
  },
  bodySmall: {
    ...createTextStyle('sm', 'regular', 'relaxed'),
    letterSpacing: typography.letterSpacing.normal,
  },

  // Labels (Functional)
  labelLarge: {
    ...createTextStyle('lg', 'medium', 'normal'),
    letterSpacing: typography.letterSpacing.snug,
  },
  labelMedium: {
    ...createTextStyle('md', 'medium', 'normal'),
    letterSpacing: typography.letterSpacing.snug,
  },
  labelSmall: {
    ...createTextStyle('sm', 'medium', 'normal'),
    letterSpacing: typography.letterSpacing.snug,
  },

  // Special cases
  button: {
    ...createTextStyle('md', 'semiBold', 'normal'),
    letterSpacing: typography.letterSpacing.wide,
  },
  caption: {
    ...createTextStyle('sm', 'regular', 'normal'),
    letterSpacing: typography.letterSpacing.normal,
  },
  overline: {
    ...createTextStyle('xs', 'bold', 'normal'),
    letterSpacing: typography.letterSpacing.widest,
    textTransform: 'uppercase' as const,
  },

  // Numbers (Tabular for dashboard alignment)
  numbers: {
    ...createTextStyle('2xl', 'bold', 'none'),
    letterSpacing: typography.letterSpacing.tight,
    fontFeatureSettings: "'tnum' on, 'lnum' on",
  },
  smallNumbers: {
    ...createTextStyle('md', 'medium', 'none'),
    letterSpacing: typography.letterSpacing.tight,
    fontFeatureSettings: "'tnum' on, 'lnum' on",
  },
};