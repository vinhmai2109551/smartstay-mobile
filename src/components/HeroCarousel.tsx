import { Image, type ImageSource } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Radius, Space } from '@/constants/theme';

export type HeroSlide = {
  image: ImageSource | number;
  eyebrow?: string;
  title: string;
};

type HeroCarouselProps = {
  slides: HeroSlide[];
  height: number;
  /** Extra bottom padding for the caption, e.g. when a search bar overlaps the hero. */
  captionInset?: number;
  interval?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

const ZOOM_TO = 1.12;

/** One slide with a slow "Ken Burns" zoom while it is on screen. */
function KenBurnsImage({ source, duration, still }: { source: ImageSource | number; duration: number; still: boolean }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (still) return;
    scale.set(withTiming(ZOOM_TO, { duration: duration + 1200, easing: Easing.linear }));
  }, [duration, scale, still]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]}>
      <Image source={source} style={StyleSheet.absoluteFill} contentFit="cover" />
    </Animated.View>
  );
}

/**
 * Auto-advancing, cross-fading photo carousel with a slow zoom on each slide.
 * Motion is disabled when the user has "Reduce Motion" turned on.
 */
export function HeroCarousel({
  slides,
  height,
  captionInset = 0,
  interval = 5000,
  radius = Radius.xl,
  style,
}: HeroCarouselProps) {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const count = slides.length;

  useEffect(() => {
    if (count < 2 || reduceMotion) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), interval);
    return () => clearInterval(timer);
  }, [count, interval, reduceMotion]);

  if (count === 0) return null;
  const slide = slides[index % count];

  return (
    <View style={[styles.container, { height, borderRadius: radius }, style]}>
      {/* Keyed by index so each slide mounts fresh: fades in over the previous one and restarts its zoom. */}
      <Animated.View
        key={index}
        entering={reduceMotion ? undefined : FadeIn.duration(900)}
        exiting={reduceMotion ? undefined : FadeOut.duration(900)}
        style={StyleSheet.absoluteFill}>
        <KenBurnsImage source={slide.image} duration={interval} still={reduceMotion} />
      </Animated.View>

      <LinearGradient
        colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.05)', 'rgba(0,0,0,0.72)']}
        locations={[0, 0.35, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View style={[styles.caption, { paddingBottom: captionInset + Space.lg }]} pointerEvents="box-none">
        <Animated.View
          key={`caption-${index}`}
          entering={reduceMotion ? undefined : FadeIn.duration(700).delay(250)}
          style={styles.captionText}>
          {slide.eyebrow ? (
            <ThemedText type="caption" style={styles.eyebrow}>
              {slide.eyebrow}
            </ThemedText>
          ) : null}
          <ThemedText type="display" style={styles.title}>
            {slide.title}
          </ThemedText>
        </Animated.View>

        {count > 1 ? (
          <View style={styles.dots}>
            {slides.map((_, i) => (
              <Pressable
                key={i}
                accessibilityRole="button"
                accessibilityLabel={`Ảnh ${i + 1} trên ${count}`}
                accessibilityState={{ selected: i === index }}
                onPress={() => setIndex(i)}
                hitSlop={{ top: 12, bottom: 12, left: 4, right: 4 }}>
                <View style={[styles.dot, i === index && styles.dotActive]} />
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: 'hidden', justifyContent: 'flex-end', backgroundColor: '#1F2937' },
  caption: { paddingHorizontal: Space.xl, gap: Space.md },
  captionText: { gap: Space.xs },
  eyebrow: { color: 'rgba(255,255,255,0.92)', letterSpacing: 2 },
  title: { color: '#FFFFFF' },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive: { width: 20, backgroundColor: '#FFFFFF' },
});
