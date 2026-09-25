import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useEffectiveColorScheme, useTheme } from '@/hooks/use-theme';

/**
 * Decorative backdrop for the auth screens: a soft blue wash with organic blobs,
 * a dashed paper-plane trail and a paw print. Purely visual — hidden from
 * screen readers and ignores touches.
 */
export function AuthBackground() {
  const theme = useTheme();
  const scheme = useEffectiveColorScheme();
  const { width, height } = useWindowDimensions();
  const isDark = scheme === 'dark';

  const wash = isDark ? ['#0F1B33', theme.background] : ['#DCE8FD', '#F4F8FF'];
  const blob = isDark ? 'rgba(96,165,250,0.10)' : 'rgba(147,187,252,0.35)';
  const blobSoft = isDark ? 'rgba(96,165,250,0.06)' : 'rgba(191,215,254,0.45)';
  const decor = isDark ? 'rgba(147,197,253,0.55)' : 'rgba(37,99,235,0.45)';

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <LinearGradient colors={wash as [string, string]} style={StyleSheet.absoluteFill} />

      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        {/* Top-left blob */}
        <Path
          d={`M0 0 H${width * 0.42} C${width * 0.3} ${height * 0.05} ${width * 0.18} ${height * 0.08} ${width * 0.12} ${height * 0.16} C${width * 0.07} ${height * 0.22} ${width * 0.03} ${height * 0.2} 0 ${height * 0.21} Z`}
          fill={blob}
        />
        {/* Bottom-left wave */}
        <Path
          d={`M0 ${height * 0.9} C${width * 0.18} ${height * 0.86} ${width * 0.34} ${height * 0.93} ${width * 0.52} ${height} H0 Z`}
          fill={blobSoft}
        />
        {/* Bottom-right blob */}
        <Path
          d={`M${width} ${height * 0.78} C${width * 0.86} ${height * 0.8} ${width * 0.8} ${height * 0.9} ${width * 0.72} ${height} H${width} Z`}
          fill={blob}
        />
        {/* Dashed paper-plane trail */}
        <Path
          d={`M${width * 0.02} ${height * 0.9} C${width * 0.08} ${height * 0.88} ${width * 0.04} ${height * 0.85} ${width * 0.09} ${height * 0.84}`}
          stroke={decor}
          strokeWidth={1.5}
          strokeDasharray="4 5"
          fill="none"
        />
      </Svg>

      <Ionicons
        name="paper-plane-outline"
        size={30}
        color={decor}
        style={[styles.plane, { top: height * 0.8, left: width * 0.07 }]}
      />
      <Ionicons name="paw" size={40} color={blob} style={[styles.paw, { top: height * 0.86, right: width * 0.05 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  plane: { position: 'absolute', transform: [{ rotate: '-18deg' }] },
  paw: { position: 'absolute', transform: [{ rotate: '18deg' }] },
});
