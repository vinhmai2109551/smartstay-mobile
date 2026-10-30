import { favoritesApi } from "@/api/favorites";
import { RoomTypeCard } from "@/components/RoomTypeCard";
import { ThemedView } from "@/components/themed-view";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorView } from "@/components/ui/ErrorView";
import { Skeleton } from "@/components/ui/Skeleton";
import { MaxContentWidth, Radius, Space } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useApi } from "@/hooks/useApi";
import { router } from "expo-router";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";

export default function FavoritesScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const fetchFavorites = useCallback(() => favoritesApi.mine(), []);

  const { data, loading, error, refetch, refreshing, refresh } = useApi(
    fetchFavorites,
    {
      refetchOnFocus: true,
    },
  );

  if (error && !data) {
    return;
    <ErrorView message={t(`favorites.loadError`)} onRetry={refetch} />;
  }

  return (
    <ThemedView style={styles.flex}>
      <FlatList
        data={loading ? [] : (data ?? [])}
        keyExtractor={(item) => item.roomTypeId}
        contentContainerStyle={styles.list}
        // The iOS 26 native header is translucent; inset the list so it starts below it.
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
        ListHeaderComponent={
          loading ? (
            <View style={styles.list}>
              {[0, 1].map((i) => (
                <Skeleton key={i} height={260} radius={Radius.lg} />
              ))}
            </View>
          ) : undefined
        }
        ListEmptyComponent={
          loading ? undefined : (
            <EmptyState
              icon="heart-outline"
              title={t("favorites.empty")}
              actionLabel={t("favorites.explore")}
              onAction={() => router.navigate("/(tabs)/search")}
            />
          )
        }
        renderItem={({ item }) => (
          <RoomTypeCard
            roomType={item}
            onPress={() =>
              router.push({
                pathname: "/room/[id]",
                params: { id: item.roomTypeId },
              })
            }
          />
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: {
    width: "100%",
    maxWidth: MaxContentWidth,
    alignSelf: "center",
    padding: Space.lg,
    gap: Space.lg,
  },
});
