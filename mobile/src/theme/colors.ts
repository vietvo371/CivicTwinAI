import { Platform } from 'react-native';

/**
 * Color System - CivicTwinAI Digital Twin
 * Primary brand color: #06B6D4 (Digital Cyan) - High-tech & Proactive
 * Secondary brand color: #0F172A (Space Navy) - Deep & Reliable
 */
export const COLORS = {
  // Brand Colors
  primary: '#06B6D4',
  primaryLight: '#67E8F9',
  primaryDark: '#0891B2',
  secondary: '#0F172A',
  secondaryLight: '#1E293B',
  accent: '#8B5CF6', // AI Violet
  
  // Background Colors
  background: '#F8FAFC',
  backgroundSecondary: '#F1F5F9',
  backgroundTertiary: '#E2E8F0',
  backgroundDark: '#020617',
  
  // Text Colors (High-contrast Slate)
  text: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#64748B',
  textLight: '#94A3B8',
  textWhite: '#FFFFFF',
  textDark: '#020617',
  
  // Status Colors (Snappy & Vibrant)
  success: '#10B981',
  successLight: '#D1FAE5',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  info: '#0EA5E9',
  infoLight: '#E0F2FE',
  
  // UI Elements
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  borderDark: '#CBD5E1',
  disabled: '#94A3B8',
  disabledBackground: '#F1F5F9',
  
  // Card & Surface (Snappy elevation)
  card: '#FFFFFF',
  cardHover: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceSecondary: '#F1F5F9',
  surfaceElevated: '#FFFFFF',
  
  // Base Colors
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  overlay: 'rgba(2, 6, 23, 0.5)',
  overlayLight: 'rgba(2, 6, 23, 0.3)',
  
  // Gradients (Digital Twin Style)
  gradientPrimary: ['#06B6D4', '#3B82F6'],
  gradientSecondary: ['#0F172A', '#1E293B'],
  gradientAI: ['#8B5CF6', '#D946EF'],
};

/**
 * Main Theme Object
 * Cross-platform design system for CivicTwinAI
 */
export const theme = {
  colors: COLORS,
  
  // Spacing System (consistent across platforms)
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    '4xl': 40,
    '5xl': 48,
  },
  
  // Border Radius (Snappy - slightly rounded but precise)
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    full: 9999,
  },
  
  // Typography (platform-aware)
  typography: {
    fontFamily: Platform.select({
      ios: 'Inter',
      android: 'Roboto',
    }),
    fontSize: {
      '2xs': 10,
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 28,
      '4xl': 32,
      '5xl': 40,
      '6xl': 48,
    },
    fontWeight: {
      regular: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
      extrabold: '800' as const,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
      loose: 2,
    },
  },
  
  // Shadows (Digital Twin Style - crisp and subtle)
  shadows: {
    none: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    xs: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    sm: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 3,
      elevation: 2,
    },
    md: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 4,
    },
    lg: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 10,
      elevation: 8,
    },
    xl: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 12,
    },
    primary: {
      shadowColor: '#06B6D4',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 6,
    },
  },
  
  // Animation
  animation: {
    duration: {
      instant: 100,
      fast: 200,
      normal: 300,
      slow: 500,
      slower: 700,
    },
  },
  
  // Layout Constants
  layout: {
    containerPadding: 16,
    screenPadding: 20,
    maxWidth: 600,
    bottomTabHeight: 60,
    headerHeight: Platform.select({ ios: 44, android: 56 }),
    statusBarHeight: Platform.select({ ios: 20, android: 0 }),
  },
}; 