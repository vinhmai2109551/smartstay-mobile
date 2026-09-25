import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { persistedStorage } from '@/store/persistedStorage';

export type ThemeMode = 'light' | 'dark' | 'system';
export type AppLanguage = 'vi' | 'en';

type SettingsState = {
  themeMode: ThemeMode;
  language: AppLanguage;
  hasHydrated: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  setLanguage: (language: AppLanguage) => void;
  setHasHydrated: (value: boolean) => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      themeMode: 'system',
      language: 'vi',
      hasHydrated: false,
      setThemeMode: (themeMode) => set({ themeMode }),
      setLanguage: (language) => set({ language }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: 'smartstay-settings',
      storage: createJSONStorage(() => persistedStorage),
      partialize: (state) => ({ themeMode: state.themeMode, language: state.language }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
