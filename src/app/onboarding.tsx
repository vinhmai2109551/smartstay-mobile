import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/BrandMark';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { DemoRoomImageByName, HeroImage } from '@/constants/demoImages';
import { MinTouch, Radius, Space } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';

type Slide = {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  image: number;
};

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const setHasSeenOnboarding = useAuthStore((s) => s.setHasSeenOnboarding);
  const listRef = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);

  const SLIDES: Slide[] = useMemo(
    () => [
      {
        key: 'slide1',
        icon: 'bed-outline',
        title: t('onboarding.slide1Title'),
        subtitle: t('onboarding.slide1Subtitle'),
        image: HeroImage,
      },
      {
        key: 'slide2',
        icon: 'sparkles-outline',
        title: t('onboarding.slide2Title'),
        subtitle: t('onboarding.slide2Subtitle'),
        image: DemoRoomImageByName['Suite Gia Đình'] ?? HeroImage,
      },
      {
        key: 'slide3',
        icon: 'shield-checkmark-outline',
        title: t('onboarding.slide3Title'),
        subtitle: t('onboarding.slide3Subtitle'),
        image: DemoRoomImageByName['Bungalow Vườn'] ?? HeroImage,
      },
    ],
    [t],
  );
  const isLast = index >= SLIDES.length - 1;

  const finish = () => {
    setHasSeenOnboarding(true);
    router.replace('/(auth)/login');
  };

  const goNext = () => {
    if (isLast) {
      finish();
      return;
    }
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
  };

  const onScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(event.nativeEvent.contentOffset.x / width));
  };

  return (
    <View style={[styles.flex, styles.dark]}>
      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <Image source={item.image} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
            <LinearGradient
              colors={['rgba(0,0,0,0.35)', 'transparent', 'rgba(0,0,0,0.85)']}
              locations={[0, 0.35, 0.8]}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            <SafeAreaView style={styles.flex} edges={['top']}>
              <View style={styles.header}>
                <BrandMark size={34} iconSize={16} />
                <ThemedText type="bodyBold" style={styles.onImage}>
                  {t('common.brandName')}
                </ThemedText>
              </View>

              <View style={styles.spacer} />

              <View style={styles.content}>
                <View style={styles.iconBadge}>
                  <Ionicons name={item.icon} size={22} color="#FFFFFF" />
                </View>
                <ThemedText type="display" style={styles.onImage}>
                  {item.title}
                </ThemedText>
                <ThemedText type="body" style={styles.subtitle}>
                  {item.subtitle}
                </ThemedText>
              </View>
            </SafeAreaView>
          </View>
        )}
      />

      <SafeAreaView style={styles.footer} edges={['bottom']} pointerEvents="box-none">
        <View style={styles.dots}>
          {SLIDES.map((slide, i) => (
            <View
              key={slide.key}
              style={[
                styles.dot,
                { backgroundColor: i === index ? '#FFFFFF' : 'rgba(255,255,255,0.4)' },
                i === index && styles.dotActive,
              ]}
            />
          ))}
        </View>

        <Button
          label={isLast ? t('onboarding.start') : t('onboarding.next')}
          icon={isLast ? 'arrow-forward' : undefined}
          size="lg"
          onPress={goNext}
        />

        {/* Kept in the layout on the last slide (just hidden) so the button doesn't jump. */}
        <Pressable
          onPress={finish}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityElementsHidden={isLast}
          disabled={isLast}
          style={[styles.skip, isLast && styles.hidden]}>
          <ThemedText type="small" style={styles.skipText}>
            {t('onboarding.skip')}
          </ThemedText>
        </Pressable>
      </SafeAreaView>

    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  dark: { backgroundColor: '#000000' },
  slide: { flex: 1, overflow: 'hidden' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.sm,
    paddingHorizontal: Space['2xl'],
    paddingTop: Space.sm,
  },
  onImage: { color: '#FFFFFF' },
  spacer: { flex: 1 },
  content: {
    paddingHorizontal: Space['2xl'],
    paddingBottom: 200,
    gap: Space.md,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Space.xs,
  },
  subtitle: { color: 'rgba(255,255,255,0.9)' },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Space['2xl'],
    gap: Space.lg,
  },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotActive: { width: 24 },
  skip: { minHeight: MinTouch, alignItems: 'center', justifyContent: 'center' },
  skipText: { color: 'rgba(255,255,255,0.9)' },
  hidden: { opacity: 0 },
});
