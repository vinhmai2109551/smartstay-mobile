/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#2B2A25',
    background: '#F7F2E6',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#EFE7D2',
    textSecondary: '#8C8676',
    primary: '#1B4332',
    primaryText: '#FFFFFF',
    accent: '#D97B4F',
    border: '#E6DECA',
    success: '#2F7D4F',
    danger: '#C1483F',
    warning: '#C08A2E',
  },
  dark: {
    text: '#F3EFE4',
    background: '#1B1A16',
    backgroundElement: '#242220',
    backgroundSelected: '#332F27',
    textSecondary: '#B4AE9E',
    primary: '#4C9A75',
    primaryText: '#0F1B14',
    accent: '#E2925F',
    border: '#3A362C',
    success: '#4FAE7C',
    danger: '#E08078',
    warning: '#D9A94D',
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

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
