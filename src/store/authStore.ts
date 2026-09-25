import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { persistedStorage } from '@/store/persistedStorage';
import { User } from '@/types/auth';

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
      storage: createJSONStorage(() => persistedStorage),
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
