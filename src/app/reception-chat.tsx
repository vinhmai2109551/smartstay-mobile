import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { receptionChatApi } from "@/api/chat";
import { ReceptionBubble } from "@/components/ReceptionBubble";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorView } from "@/components/ui/ErrorView";
import { LoadingView } from "@/components/ui/LoadingView";
import {
  FontFamily,
  MaxContentWidth,
  MinTouch,
  Radius,
  Space,
} from "@/constants/theme";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useTheme } from "@/hooks/use-theme";
import { useAuthStore } from "@/store/authStore";
import { useSocketStore } from "@/store/socketStore";
import { toast } from "@/store/toastStore";
import { ReceptionMessage } from "@/types/chat";
import { formatDate } from "@/utils/date";
import { TFunction } from "i18next";
import { getApiErrorMessage } from "@/api/client";

// Consecutive messages from one sender within this window are drawn as one group.
const GROUP_WINDOW_MS = 3 * 60 * 1000;

function sameGroup(a?: ReceptionMessage, b?: ReceptionMessage) {
  return (
    !!a &&
    !!b &&
    a.senderId === b.senderId &&
    Math.abs(dayjs(a.createdAt).diff(b.createdAt)) < GROUP_WINDOW_MS
  );
}

function dayLabel(value: string, t: TFunction) {
  const day = dayjs(value);
  if (day.isSame(dayjs(), "day")) return t("receptionChat.today");
  if (day.isSame(dayjs().subtract(1, "day"), "day"))
    return t("receptionChat.yesterday");
  return formatDate(value);
}

export default function ReceptionChatScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const isOnline = useNetworkStatus();
  const userId = useAuthStore((s) => s.user?.userId);
  const socket = useSocketStore((s) => s.socket);
  const listRef = useRef<FlatList<ReceptionMessage>>(null);

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ReceptionMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [attempt, setAttempt] = useState(0); // bumped by "Retry"
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<ImagePicker.ImagePickerAsset | null>(
    null,
  );
  const [uploading, setUploading] = useState(false);

  // Open (or create) the guest's conversation and load its history.
  useEffect(() => {
    let cancelled = false;
    receptionChatApi
      .openConversation()
      .then(async ({ conversationId: id }) => {
        const history = await receptionChatApi.messages(id);
        if (cancelled) return;
        setConversationId(id);
        setMessages(history);
      })
      .catch(() => !cancelled && setLoadFailed(true))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  // Live messages. A reconnect drops the socket's rooms and misses anything sent
  // meanwhile, so rejoin and refetch on every connect.
  useEffect(() => {
    if (!socket || !conversationId) return;
    const join = () => socket.emit("chat:join", { conversationId });
    const onConnect = () => {
      join();
      receptionChatApi
        .messages(conversationId)
        .then(setMessages)
        .catch(() => {});
    };
    const onMessage = (message: ReceptionMessage) => {
      if (message.conversationId !== conversationId) return;
      // The server echoes our own messages back; a refetch can also overlap.
      setMessages((prev) =>
        prev.some((m) => m.messageId === message.messageId)
          ? prev
          : [...prev, message],
      );
    };
    const onError = (error: { message?: string }) =>
      toast.error(error?.message ?? t("receptionChat.sendFailed"));

    if (socket.connected) join();
    socket.on("connect", onConnect);
    socket.on("chat:message", onMessage);
    socket.on("exception", onError);
    return () => {
      socket.off("connect", onConnect);
      socket.off("chat:message", onMessage);
      socket.off("exception", onError);
    };
  }, [socket, conversationId, t]);

  const send = async (text: string) => {
    const content = text.trim();
    if ((!content && !pending) || !conversationId || uploading) return;
    if (!socket?.connected) {
      toast.error(t("receptionChat.sendFailed"));
      return;
    }
    let attachment = {};
    if (pending) {
      setUploading(true);
      try {
        const { url, type } = await receptionChatApi.uploadAttachment({
          uri: pending.uri,
          name: pending.fileName ?? "photo.jpg",
          type: pending.mimeType ?? "image/jpeg",
        });
        attachment = { attachmentUrl: url, attachmentType: type };
      } catch {
        toast.error(getApiErrorMessage(t("receptionChat.sendFailed")));
        return;
      } finally {
        setUploading(false);
      }
    }
    // No optimistic append — the server broadcasts our message back to the room.
    socket.emit("chat:message", { conversationId, content, ...attachment });
    setInput("");
    setPending(null);
  };
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      // Dùng cho Iphone
      preferredAssetRepresentationMode:
        ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(
        asset.mimeType ?? "image/jpeg",
      )
    ) {
      toast.error(t("receptionChat.imageType"));
      return;
    }
    if ((asset.fileSize ?? 0) > 5 * 1024 * 1024) {
      toast.error(t("receptionChat.imageTooLarge"));
      return;
    }
    setPending(asset);
  };

  const canSend =
    (!!input.trim() || !!pending) && isOnline && !uploading && !!conversationId;
  const header = (
    <View style={[styles.header, { borderBottomColor: theme.border }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("common.back")}
        onPress={() => router.back()}
        hitSlop={10}
      >
        <Ionicons name="chevron-back" size={26} color={theme.text} />
      </Pressable>
      <View style={[styles.avatar, { backgroundColor: theme.primarySoft }]}>
        <Ionicons name="headset-outline" size={20} color={theme.primary} />
      </View>
      <View style={styles.flex}>
        <ThemedText type="bodyBold">{t("receptionChat.title")}</ThemedText>
        <View style={styles.statusRow}>
          <View
            style={[styles.statusDot, { backgroundColor: theme.success }]}
          />
          <ThemedText type="caption" themeColor="textSecondary">
            {t("receptionChat.online")}
          </ThemedText>
        </View>
      </View>
    </View>
  );

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={["top", "bottom"]}>
        {header}
        {loading ? (
          <LoadingView />
        ) : loadFailed ? (
          <ErrorView
            message={t("receptionChat.loadFailed")}
            onRetry={() => {
              setLoadFailed(false);
              setLoading(true);
              setAttempt((a) => a + 1);
            }}
          />
        ) : (
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={(m) => m.messageId}
              contentContainerStyle={styles.list}
              keyboardShouldPersistTaps="handled"
              onContentSizeChange={() =>
                listRef.current?.scrollToEnd({ animated: true })
              }
              ListEmptyComponent={
                <View>
                  <EmptyState
                    icon="headset-outline"
                    title={t("receptionChat.emptyTitle")}
                    description={t("receptionChat.emptyDescription")}
                  />
                  <View style={styles.prompts}>
                    {(
                      t("receptionChat.prompts", {
                        returnObjects: true,
                      }) as string[]
                    ).map((prompt) => (
                      <Chip
                        key={prompt}
                        label={prompt}
                        onPress={() => send(prompt)}
                        disabled={!isOnline}
                      />
                    ))}
                  </View>
                </View>
              }
              renderItem={({ item, index }) => {
                const prev = messages[index - 1];
                const next = messages[index + 1];
                const newDay =
                  !prev || !dayjs(prev.createdAt).isSame(item.createdAt, "day");
                const grouped = !newDay && sameGroup(prev, item);
                return (
                  <View
                    style={{
                      marginTop:
                        index === 0 ? 0 : grouped ? Space.xs : Space.md,
                    }}
                  >
                    {newDay ? (
                      <ThemedText
                        type="caption"
                        themeColor="textSecondary"
                        style={styles.day}
                      >
                        {dayLabel(item.createdAt, t)}
                      </ThemedText>
                    ) : null}
                    <ReceptionBubble
                      message={item}
                      mine={item.senderId === userId}
                      showName={!grouped}
                      showTime={!sameGroup(item, next)}
                    />
                  </View>
                );
              }}
            />
            {pending ? (
              <View
                style={[
                  styles.preview,
                  {
                    borderTopColor: theme.border,
                    backgroundColor: theme.background,
                  },
                ]}
              >
                <View>
                  <Image
                    source={{ uri: pending.uri }}
                    style={styles.previewImage}
                    contentFit="cover"
                  />
                  {uploading ? (
                    <View style={styles.previewOverlay}>
                      <ActivityIndicator color="#FFFFFF" />
                    </View>
                  ) : null}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t("receptionChat.removeImage")}
                    onPress={() => setPending(null)}
                    disabled={uploading}
                    hitSlop={8}
                    style={[
                      styles.previewRemove,
                      { backgroundColor: theme.text },
                    ]}
                  >
                    <Ionicons name="close" size={14} color={theme.background} />
                  </Pressable>
                </View>
              </View>
            ) : null}
            <View
              style={[
                styles.inputBar,
                {
                  borderTopColor: theme.border,
                  borderTopWidth: pending ? 0 : StyleSheet.hairlineWidth,
                  backgroundColor: theme.background,
                },
              ]}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("receptionChat.attach")}
                onPress={pickImage}
                disabled={uploading}
                hitSlop={6}
                style={styles.attachButton}
              >
                <Ionicons
                  name="image-outline"
                  size={24}
                  color={theme.textSecondary}
                />
              </Pressable>

              <View
                style={[
                  styles.inputPill,
                  {
                    backgroundColor: theme.backgroundElement,
                    borderColor: theme.border,
                  },
                ]}
              >
                <TextInput
                  value={input}
                  onChangeText={setInput}
                  placeholder={t("receptionChat.placeholder")}
                  placeholderTextColor={theme.textSecondary}
                  multiline
                  style={[styles.input, { color: theme.text }]}
                />
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("receptionChat.send")}
                onPress={() => send(input)}
                disabled={!canSend}
                style={[
                  styles.sendButton,
                  {
                    backgroundColor: theme.primary,
                    opacity: canSend ? 1 : 0.4,
                  },
                ]}
              >
                {uploading ? (
                  <ActivityIndicator color={theme.primaryText} />
                ) : (
                  <Ionicons name="send" size={18} color={theme.primaryText} />
                )}
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Space.md,
    paddingHorizontal: Space.lg,
    paddingVertical: Space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  statusRow: { flexDirection: "row", alignItems: "center", gap: Space.xs + 2 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  list: {
    flexGrow: 1,
    width: "100%",
    maxWidth: MaxContentWidth,
    alignSelf: "center",
    padding: Space.lg,
  },
  day: { textAlign: "center", marginVertical: Space.sm },
  prompts: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: Space.sm,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Space.sm,
    paddingHorizontal: Space.md,
    paddingVertical: Space.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  inputPill: {
    flex: 1,
    minHeight: MinTouch + 4,
    maxHeight: 120,
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Space.lg,
    justifyContent: "center",
  },
  input: {
    fontFamily: FontFamily.regular,
    fontSize: 16,
    paddingTop: Space.md,
    paddingBottom: Space.md,
    maxHeight: 116,
  },
  sendButton: {
    width: MinTouch + 4,
    height: MinTouch + 4,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  attachButton: {
    width: MinTouch,
    height: MinTouch + 4,
    alignItems: "center",
    justifyContent: "center",
  },
  preview: {
    flexDirection: "row",
    paddingHorizontal: Space.md,
    paddingTop: Space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  previewImage: { width: 56, height: 56, borderRadius: Radius.sm },
  previewOverlay: {
    ...StyleSheet.absoluteFill,
    borderRadius: Radius.sm,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  previewRemove: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});
