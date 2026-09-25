import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { DemoRoomImageByName, HeroImage } from '@/constants/demoImages';
import { Radius, Space } from '@/constants/theme';

function useTiles() {
  const { t } = useTranslation();
  return useMemo(
    () => [
      { image: HeroImage, label: t('home.tile1Label') },
      { image: DemoRoomImageByName['Deluxe View Biển'], label: t('home.tile2Label') },
      { image: DemoRoomImageByName['Bungalow Vườn'], label: t('home.tile3Label') },
      { image: DemoRoomImageByName['Suite Gia Đình'], label: t('home.tile4Label') },
      { image: DemoRoomImageByName['Dorm 6 Giường'], label: t('home.tile5Label') },
    ],
    [t],
  );
}

function Tile({ index, style, tiles }: { index: number; style: object; tiles: ReturnType<typeof useTiles> }) {
  const tile = tiles[index];
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
  const { t } = useTranslation();
  const tiles = useTiles();
  const gap = Space.sm;
  const height = Math.round(Math.min(width * 0.7, 300));
  const small = (height - gap) / 2;

  return (
    <View style={[styles.row, { height, gap }]} accessibilityLabel={t('home.galleryAccessibility')}>
      <Tile index={0} style={{ flex: 1.1, height }} tiles={tiles} />
      <View style={[styles.grid, { gap }]}>
        <View style={[styles.gridRow, { gap }]}>
          <Tile index={1} style={{ flex: 1, height: small }} tiles={tiles} />
          <Tile index={2} style={{ flex: 1, height: small }} tiles={tiles} />
        </View>
        <View style={[styles.gridRow, { gap }]}>
          <Tile index={3} style={{ flex: 1, height: small }} tiles={tiles} />
          <Tile index={4} style={{ flex: 1, height: small }} tiles={tiles} />
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
