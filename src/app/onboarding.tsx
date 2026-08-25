import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  ImageBackground,
  Pressable,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/BrandMark';
import { ThemedText } from '@/components/themed-text';
import { HeroImage } from '@/constants/demoImages';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/authStore';

const { width } = Dimensions.get('window');

type Slide = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
};

const SLIDES: Slide[] = [
  {
    icon: 'bed-outline',
    title: 'Chào mừng đến SmartStay',
    subtitle: 'Không gian nghỉ dưỡng ven biển Đà Nẵng với phòng ấm cúng và dịch vụ tận tâm.',
  },
  {
    icon: 'sparkles-outline',
    title: 'Đặt phòng bằng hội thoại',
    subtitle: 'Nhắn cho trợ lý AI như nhắn lễ tân: hỏi phòng trống, giá, chính sách và đặt ngay.',
  },
  {
    icon: 'shield-checkmark-outline',
    title: 'Thanh toán an toàn',
    subtitle: 'Quét VietQR qua PayOS, nhận mã đặt phòng và QR check-in ngay lập tức.',
  },
];

export default function OnboardingScreen() {
  const theme = useTheme();
  const setHasSeenOnboarding = useAuthStore((s) => s.setHasSeenOnboarding);
  const listRef = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);

  const finish = () => {
    setHasSeenOnboarding(true);
    router.replace('/(auth)/login');
  };

  const goNext = () => {
    if (index >= SLIDES.length - 1) {
      finish();
      return;
    }
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
  };

  const onScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(event.nativeEvent.contentOffset.x / width);
    setIndex(next);
  };

  return (
    <View style={styles.flex}>
      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item.title}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        renderItem={({ item }) => (
          <ImageBackground source={HeroImage} style={[styles.slide, { width }]} resizeMode="cover">
            <LinearGradient
              colors={['rgba(0,0,0,0.15)', 'transparent', 'rgba(0,0,0,0.7)']}
              locations={[0, 0.4, 1]}
              style={StyleSheet.absoluteFillObject}
              pointerEvents="none"
            />
            <SafeAreaView style={styles.flex} edges={['top']}>
              <View style={styles.header}>
                <BrandMark size={32} />
                <ThemedText type="smallBold" style={styles.brandText}>
                  SmartStay
                </ThemedText>
              </View>

              <View style={styles.spacer} />

              <View style={styles.content}>
                <View style={styles.iconBadge}>
                  <Ionicons name={item.icon} size={22} color="#FFFFFF" />
                </View>
                <ThemedText type="title" style={styles.title}>
                  {item.title}
                </ThemedText>
                <ThemedText style={styles.subtitle}>{item.subtitle}</ThemedText>
              </View>
            </SafeAreaView>
          </ImageBackground>
        )}
      />

      <SafeAreaView style={styles.footer} edges={['bottom']} pointerEvents="box-none">
        <View style={styles.dots}>
          {SLIDES.map((slide, i) => (
            <View
              key={slide.title}
              style={[
                styles.dot,
                { backgroundColor: i === index ? theme.accent : 'rgba(255,255,255,0.4)' },
                i === index && styles.dotActive,
              ]}
            />
          ))}
        </View>

        <Pressable style={[styles.cta, { backgroundColor: theme.primary }]} onPress={goNext}>
          <ThemedText type="smallBold" style={styles.ctaLabel}>
            {index === SLIDES.length - 1 ? 'Bắt đầu' : 'Tiếp tục'}
          </ThemedText>
        </Pressable>

        <Pressable onPress={finish} hitSlop={8}>
          <ThemedText type="small" style={styles.skip}>
            Bỏ qua, xem phòng trước
          </ThemedText>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  slide: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
  },
  brandText: { color: '#FFFFFF', fontSize: 16 },
  spacer: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.four,
    paddingBottom: 180,
    gap: Spacing.two,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  title: { color: '#FFFFFF' },
  subtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 14, lineHeight: 21 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
    alignItems: 'stretch',
  },
  dots: { flexDirection: 'row', gap: 6, alignSelf: 'flex-start' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotActive: { width: 20 },
  cta: {
    borderRadius: 999,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaLabel: { color: '#FFFFFF' },
  skip: { color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginBottom: Spacing.two },
});
