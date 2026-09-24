import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';

import { User } from '@/types/auth';

// expo-secure-store isn't available on web (its calls reject there), so
// persistence falls back to localStorage for that platform only.
const secureStorage: StateStorage =
  Platform.OS === 'web'
    ? {
        getItem: async (name) => localStorage.getItem(name),
        setItem: async (name, value) => localStorage.setItem(name, value),
        removeItem: async (name) => localStorage.removeItem(name),
      }
    : {
        getItem: async (name) => (await SecureStore.getItemAsync(name)) ?? null,
        setItem: async (name, value) => SecureStore.setItemAsync(name, value),
        removeItem: async (name) => SecureStore.deleteItemAsync(name),
      };

type AuthState = {
  accessToken: string | null;
  user: User | null;
  hasHydrated: boolean;
  hasSeenOnboarding: boolean;
  setSession: (accessToken: string, user: User) => void;
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
      user: null,
      hasHydrated: false,
      hasSeenOnboarding: false,
      setSession: (accessToken, user) => set({ accessToken, user }),
      setAccessToken: (accessToken) => set({ accessToken }),
      updateUser: (user) => set({ user }),
      clearSession: () => set({ accessToken: null, user: null }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
      setHasSeenOnboarding: (value) => set({ hasSeenOnboarding: value }),
    }),
    {
      name: 'smartstay-auth',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
        hasSeenOnboarding: state.hasSeenOnboarding,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
