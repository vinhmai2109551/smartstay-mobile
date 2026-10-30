import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { receptionChatApi } from "@/api/chat";
import { useAuthStore } from "@/store/authStore";
import { plainStorage } from "@/store/persistedStorage";
import { ReceptionMessage } from "@/types/chat";

type ReceptionChatState = {
  conversationId: string | null;
  // createdAt (server time) of the newest message the guest has seen.
  lastReadAt: string | null;
  unread: number;
  setConversation: (conversationId: string) => void;
  markRead: (createdAt: string) => void;
  receive: (message: ReceptionMessage) => void;
  sync: () => Promise<void>;
  reset: () => void;
  // createdAt of the newest message seen on the socket/API, used when the guest reads on another device.
  latestAt: string | null;
  readElsewhere: (conversationId: string) => void;
};

const isFromStaff = (m: ReceptionMessage) =>
  m.senderId !== useAuthStore.getState().user?.userId;

export const useReceptionChatStore = create<ReceptionChatState>()(
  persist(
    (set, get) => ({
      conversationId: null,
      lastReadAt: null,
      unread: 0,
      latestAt: null,
      setConversation: (conversationId) => set({ conversationId }),
      markRead: (createdAt) => set({ lastReadAt: createdAt, unread: 0 }),
      receive: (message) => {
        if (message.conversationId !== get().conversationId) return;
        if (isFromStaff(message)) {
          set((s) => ({ unread: s.unread + 1, latestAt: message.createdAt }));
        } else {
          // The guest replied (from web or this phone), so everything before it was seen.
          get().markRead(message.createdAt);
        }
      },
      // The guest is typing in this conversation on another device (web), so they are reading it there.
      readElsewhere: (conversationId) => {
        const { latestAt } = get();
        if (conversationId === get().conversationId && latestAt)
          get().markRead(latestAt);
      },
      // Backend only tracks unread for staff, so the guest's count is worked out here.
      sync: async () => {
        const { conversationId, lastReadAt } = get();
        if (!conversationId) return;
        const messages = await receptionChatApi.messages(conversationId);
        let unread = 0;
        for (const m of messages) {
          // A guest reply (from any device) means everything before it was read.
          if (!isFromStaff(m)) unread = 0;
          else if (!lastReadAt || m.createdAt > lastReadAt) unread++;
        }
        set({ unread, latestAt: messages.at(-1)?.createdAt ?? null });
      },
      reset: () =>
        set({ conversationId: null, lastReadAt: null, unread: 0, latestAt: null }),
    }),
    {
      name: "smartstay-reception-chat",
      storage: createJSONStorage(() => plainStorage),
      partialize: (s) => ({
        conversationId: s.conversationId,
        lastReadAt: s.lastReadAt,
      }),
    },
  ),
);
