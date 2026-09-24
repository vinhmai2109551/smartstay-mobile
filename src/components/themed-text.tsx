import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { FontFamily, Fonts, ThemeColor, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextType =
  // Typography scale
  | 'display'
  | 'title'
  | 'heading'
  | 'body'
  | 'bodyBold'
  | 'small'
  | 'smallBold'
  | 'caption'
  // Legacy types kept so older screens don't break
  | 'default'
  | 'subtitle'
  | 'link'
  | 'code';

export type ThemedTextProps = TextProps & {
  type?: ThemedTextType;
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return <Text style={[{ color: theme[themeColor ?? 'text'] }, styles[type], style]} {...rest} />;
}

const styles = StyleSheet.create({
  display: Typography.display,
  title: Typography.title,
  heading: Typography.heading,
  body: Typography.body,
  bodyBold: Typography.bodyBold,
  small: Typography.small,
  smallBold: Typography.smallBold,
  caption: Typography.caption,
  default: { ...Typography.body, fontFamily: FontFamily.medium },
  subtitle: { fontFamily: FontFamily.serif, fontSize: 20, lineHeight: 28 },
  link: { fontFamily: FontFamily.bold, fontSize: 14, lineHeight: 30 },
  code: {
    fontFamily: Fonts.mono,
    fontWeight: Platform.select({ android: 700 }) ?? 500,
    fontSize: 12,
  },
});
