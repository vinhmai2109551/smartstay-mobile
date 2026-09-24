/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

// Palette mirrors the customer-facing web frontend (Tailwind: blue-600 primary,
// gray scale, amber highlights). Pairs used for text are checked against WCAG AA.
export const Colors = {
  light: {
    text: '#111827', // gray-900
    background: '#F9FAFB', // gray-50
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#F3F4F6', // gray-100
    textSecondary: '#6B7280', // gray-500 — 4.6:1 on background
    primary: '#2563EB', // blue-600
    primaryText: '#FFFFFF', // 5.2:1 on primary
    primarySoft: '#EFF6FF', // blue-50
    // Accent (amber-500) is decorative only; use accentText for amber text.
    accent: '#F59E0B',
    accentText: '#B45309', // amber-700
    accentSoft: '#FFFBEB', // amber-50
    border: '#E5E7EB', // gray-200
    success: '#047857', // emerald-700 (emerald-600 is only 3.8:1)
    danger: '#DC2626', // red-600
    warning: '#B45309', // amber-700
  },
  dark: {
    text: '#F3F4F6', // gray-100
    background: '#111827', // gray-900
    backgroundElement: '#1F2937', // gray-800
    backgroundSelected: '#374151', // gray-700
    textSecondary: '#9CA3AF', // gray-400
    primary: '#60A5FA', // blue-400
    primaryText: '#111827',
    primarySoft: '#1E3A8A', // blue-900
    accent: '#FBBF24', // amber-400
    accentText: '#FBBF24',
    accentSoft: '#422006',
    border: '#374151', // gray-700
    success: '#34D399', // emerald-400
    danger: '#F87171', // red-400
    warning: '#FBBF24', // amber-400
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

/** Legacy spacing keys — still used by older screens. New code uses `Space`. */
export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

/** 4-point spacing scale. */
export const Space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 48,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 20,
  xl: 28,
  full: 999,
} as const;

/**
 * Font family names as registered with useFonts in the root layout. Custom
 * fonts need one family per weight: `fontWeight` doesn't pick a weight of a
 * custom font on Android.
 */
export const FontFamily = {
  serif: 'PlayfairDisplay_600SemiBold',
  serifBold: 'PlayfairDisplay_700Bold',
  regular: 'BeVietnamPro_400Regular',
  medium: 'BeVietnamPro_500Medium',
  semiBold: 'BeVietnamPro_600SemiBold',
  bold: 'BeVietnamPro_700Bold',
} as const;

export const Typography = {
  display: { fontFamily: FontFamily.serifBold, fontSize: 32, lineHeight: 40 },
  title: { fontFamily: FontFamily.serif, fontSize: 26, lineHeight: 34 },
  heading: { fontFamily: FontFamily.semiBold, fontSize: 20, lineHeight: 28 },
  body: { fontFamily: FontFamily.regular, fontSize: 16, lineHeight: 24 },
  bodyBold: { fontFamily: FontFamily.semiBold, fontSize: 16, lineHeight: 24 },
  small: { fontFamily: FontFamily.medium, fontSize: 14, lineHeight: 20 },
  smallBold: { fontFamily: FontFamily.bold, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: FontFamily.medium, fontSize: 12, lineHeight: 16 },
} as const;

/** Cross-platform shadows (boxShadow works on iOS and Android with the New Architecture). */
export const Shadows = {
  light: {
    card: { boxShadow: '0px 4px 16px rgba(17, 24, 39, 0.08)' },
    floating: { boxShadow: '0px 10px 28px rgba(17, 24, 39, 0.14)' },
  },
  dark: {
    card: { boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.28)' },
    floating: { boxShadow: '0px 10px 28px rgba(0, 0, 0, 0.4)' },
  },
} as const;

/** Minimum touch target (Apple HIG / WCAG 2.5.8). */
export const MinTouch = 44;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
