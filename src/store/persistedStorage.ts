import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { type StateStorage } from 'zustand/middleware';

// expo-secure-store isn't available on web (its calls reject there), so
// persistence falls back to localStorage for that platform only. Shared by
// every persisted zustand store in the app (auth, settings, ...).
export const persistedStorage: StateStorage =
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
