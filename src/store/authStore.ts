import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';

import { AuthTokens, User } from '@/types/auth';

const secureStorage: StateStorage = {
  getItem: async (name) => (await SecureStore.getItemAsync(name)) ?? null,
  setItem: async (name, value) => SecureStore.setItemAsync(name, value),
  removeItem: async (name) => SecureStore.deleteItemAsync(name),
};

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  hasHydrated: boolean;
  hasSeenOnboarding: boolean;
  setSession: (tokens: AuthTokens, user: User) => void;
  setAccessToken: (accessToken: string) => void;
  updateUser: (user: User) => void;
  clearSession: () => void;
  setHasHydrated: (value: boolean) => void;
  setHasSeenOnboarding: (value: boolean) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      hasHydrated: false,
      hasSeenOnboarding: false,
      setSession: (tokens, user) =>
        set({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, user }),
      setAccessToken: (accessToken) => set({ accessToken }),
      updateUser: (user) => set({ user }),
      clearSession: () => set({ accessToken: null, refreshToken: null, user: null }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
      setHasSeenOnboarding: (value) => set({ hasSeenOnboarding: value }),
    }),
    {
      name: 'smartstay-auth',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        hasSeenOnboarding: state.hasSeenOnboarding,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
