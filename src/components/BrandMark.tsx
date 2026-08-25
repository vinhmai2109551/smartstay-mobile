import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

type BrandMarkProps = {
  size?: number;
  iconSize?: number;
};

export function BrandMark({ size = 40, iconSize }: BrandMarkProps) {
  return (
    <LinearGradient
      colors={['#4C9A75', '#D97B4F']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.badge, { width: size, height: size, borderRadius: size / 2 }]}>
      <View style={styles.iconWrap}>
        <Ionicons name="sparkles" size={iconSize ?? size * 0.5} color="#FFFFFF" />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  badge: { alignItems: 'center', justifyContent: 'center' },
  iconWrap: { alignItems: 'center', justifyContent: 'center' },
});
