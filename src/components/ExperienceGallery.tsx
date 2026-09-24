import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { DemoRoomImageByName, HeroImage } from '@/constants/demoImages';
import { Radius, Space } from '@/constants/theme';

const TILES = [
  { image: HeroImage, label: 'Hồ bơi vô cực' },
  { image: DemoRoomImageByName['Deluxe View Biển'], label: 'Phòng hướng biển' },
  { image: DemoRoomImageByName['Bungalow Vườn'], label: 'Bungalow giữa vườn' },
  { image: DemoRoomImageByName['Suite Gia Đình'], label: 'Suite gia đình' },
  { image: DemoRoomImageByName['Dorm 6 Giường'], label: 'Không gian trẻ trung' },
];

function Tile({ index, style }: { index: number; style: object }) {
  const tile = TILES[index];
  return (
    <Animated.View entering={FadeInDown.duration(500).delay(index * 90)} style={[styles.tile, style]}>
      <Image source={tile.image} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.65)']}
        locations={[0.45, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <ThemedText type="caption" style={styles.label} numberOfLines={1}>
        {tile.label}
      </ThemedText>
    </Animated.View>
  );
}

/** Photo mosaic showcasing the property: one tall tile beside a 2×2 grid. */
export function ExperienceGallery({ width }: { width: number }) {
  const gap = Space.sm;
  const height = Math.round(Math.min(width * 0.7, 300));
  const small = (height - gap) / 2;

  return (
    <View style={[styles.row, { height, gap }]} accessibilityLabel="Hình ảnh khách sạn SmartStay">
      <Tile index={0} style={{ flex: 1.1, height }} />
      <View style={[styles.grid, { gap }]}>
        <View style={[styles.gridRow, { gap }]}>
          <Tile index={1} style={{ flex: 1, height: small }} />
          <Tile index={2} style={{ flex: 1, height: small }} />
        </View>
        <View style={[styles.gridRow, { gap }]}>
          <Tile index={3} style={{ flex: 1, height: small }} />
          <Tile index={4} style={{ flex: 1, height: small }} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  grid: { flex: 1.3 },
  gridRow: { flexDirection: 'row' },
  tile: { borderRadius: Radius.md, overflow: 'hidden', justifyContent: 'flex-end' },
  label: { color: '#FFFFFF', padding: Space.sm },
});
