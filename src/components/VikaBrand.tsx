import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { FontFamily, Space } from '@/constants/theme';
import { useEffectiveColorScheme } from '@/hooks/use-theme';

/** Brand colours of the Vika Hotel identity (fixed, independent of the app theme). */
export const VikaBrandColors = {
  navy: '#0E1C36',
  gold: '#C9A45C',
  goldLight: '#E6CF97',
} as const;

type EmblemProps = {
  size?: number;
  style?: StyleProp<ViewStyle>;
  /** Drop shadow under the badge (as in the brand artwork). */
  elevated?: boolean;
};

/**
 * Round Vika emblem: navy disc with a gold rim, a dashed inner ring and a
 * line-drawn cat face. Drawn as SVG so it stays crisp at any size.
 */
export function VikaEmblem({ size = 96, style, elevated = true }: EmblemProps) {
  const r = size / 2;
  const stroke = Math.max(1.5, size * 0.022);
  // Cat artwork is drawn on a 48×48 grid and scaled to ~42% of the badge.
  const catScale = (size * 0.42) / 48;
  const catOffset = r - 24 * catScale;

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel="Logo Vika Hotel"
      style={[
        { width: size, height: size, borderRadius: r },
        elevated && styles.elevated,
        style,
      ]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle cx={r} cy={r} r={r - stroke / 2} fill={VikaBrandColors.navy} stroke={VikaBrandColors.gold} strokeWidth={stroke} />
        <Circle
          cx={r}
          cy={r}
          r={r - size * 0.085}
          fill="none"
          stroke={VikaBrandColors.goldLight}
          strokeWidth={Math.max(0.8, size * 0.008)}
          strokeDasharray={`${size * 0.028} ${size * 0.028}`}
          strokeOpacity={0.85}
        />
        <G transform={`translate(${catOffset} ${catOffset}) scale(${catScale})`}>
          {/* Head with pointed ears */}
          <Path
            d="M9.5 21 L11.5 7.5 L20 13.6 Q24 12.6 28 13.6 L36.5 7.5 L38.5 21 Q40.5 26.5 38.4 31.6 Q34.6 40 24 40 Q13.4 40 9.6 31.6 Q7.5 26.5 9.5 21 Z"
            fill="none"
            stroke={VikaBrandColors.gold}
            strokeWidth={2.4}
            strokeLinejoin="round"
          />
          {/* Eyes */}
          <Circle cx={18.3} cy={25.5} r={1.9} fill={VikaBrandColors.gold} />
          <Circle cx={29.7} cy={25.5} r={1.9} fill={VikaBrandColors.gold} />
          {/* Nose + mouth */}
          <Path d="M22.4 30.2 L25.6 30.2 L24 32.1 Z" fill={VikaBrandColors.gold} />
          <Path
            d="M24 32.1 Q23 34 21.4 33.6 M24 32.1 Q25 34 26.6 33.6"
            fill="none"
            stroke={VikaBrandColors.gold}
            strokeWidth={1.3}
            strokeLinecap="round"
          />
        </G>
      </Svg>
    </View>
  );
}

type WordmarkProps = {
  /** Font size of "VIKA"; the rest scales from it. */
  size?: number;
  style?: StyleProp<ViewStyle>;
};

/** "VIKA" wordmark with the gold line–dot–line divider and "HOTEL" underneath. */
export function VikaWordmark({ size = 34, style }: WordmarkProps) {
  const scheme = useEffectiveColorScheme();
  // Navy disappears on the dark background, so the name switches to ivory there.
  const nameColor = scheme === 'dark' ? '#F4EFE3' : VikaBrandColors.navy;
  const lineWidth = size * 0.62;

  return (
    <View style={[styles.wordmark, style]} accessible accessibilityRole="header" accessibilityLabel="Vika Hotel">
      <ThemedText
        style={{
          color: nameColor,
          fontFamily: FontFamily.bold,
          fontSize: size,
          lineHeight: size * 1.18,
          letterSpacing: size * 0.04,
        }}>
        VIKA
      </ThemedText>
      <View style={[styles.divider, { gap: size * 0.16, marginTop: size * 0.08 }]}>
        <View style={[styles.line, { width: lineWidth }]} />
        <View style={[styles.dot, { width: size * 0.13, height: size * 0.13, borderRadius: size * 0.065 }]} />
        <View style={[styles.line, { width: lineWidth }]} />
      </View>
      <ThemedText
        style={{
          color: VikaBrandColors.gold,
          fontFamily: FontFamily.medium,
          fontSize: size * 0.36,
          lineHeight: size * 0.5,
          letterSpacing: size * 0.12,
          marginTop: size * 0.08,
        }}>
        HOTEL
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  elevated: {
    boxShadow: '0px 10px 24px rgba(14, 28, 54, 0.28)',
  },
  wordmark: { alignItems: 'center', gap: 0, paddingTop: Space.xs },
  divider: { flexDirection: 'row', alignItems: 'center' },
  line: { height: 1, backgroundColor: VikaBrandColors.gold, opacity: 0.8 },
  dot: { backgroundColor: VikaBrandColors.gold },
});
