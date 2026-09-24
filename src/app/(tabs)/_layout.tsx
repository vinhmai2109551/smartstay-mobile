import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StyleSheet, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FontFamily, Space } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type IconName = keyof typeof Ionicons.glyphMap;

// Filled icon when active, outline when inactive.
function tabIcon(active: IconName, inactive: IconName) {
  function TabIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
    return <Ionicons name={focused ? active : inactive} size={24} color={color as string} />;
  }
  return TabIcon;
}

const TAB_BAR_CONTENT_HEIGHT = 56;

export default function TabsLayout() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  // Devices without a home indicator still get a little breathing room below the labels.
  const bottomPadding = Math.max(insets.bottom, Space.sm);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarLabelStyle: { fontFamily: FontFamily.medium, fontSize: 11 },
        tabBarItemStyle: { paddingTop: Space.sm },
        tabBarStyle: {
          backgroundColor: theme.backgroundElement,
          borderTopColor: theme.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: TAB_BAR_CONTENT_HEIGHT + bottomPadding,
          paddingBottom: bottomPadding,
          elevation: 0,
        },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Trang chủ', tabBarIcon: tabIcon('home', 'home-outline') }} />
      <Tabs.Screen name="search" options={{ title: 'Tìm phòng', tabBarIcon: tabIcon('search', 'search-outline') }} />
      <Tabs.Screen
        name="chat"
        options={{ title: 'Trợ lý AI', tabBarIcon: tabIcon('chatbubble-ellipses', 'chatbubble-ellipses-outline') }}
      />
      <Tabs.Screen
        name="bookings"
        options={{ title: 'Đơn của tôi', tabBarIcon: tabIcon('receipt', 'receipt-outline') }}
      />
      <Tabs.Screen name="profile" options={{ title: 'Tài khoản', tabBarIcon: tabIcon('person', 'person-outline') }} />
    </Tabs>
  );
}
