import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { type StateStorage } from 'zustand/middleware';

// expo-secure-store isn't available on web (its calls reject there), so this falls back
// to localStorage for that platform only. Use this ONLY for secrets (the access token) —
// everything else should use `plainStorage` below, which is plenty durable without the
// OS keychain overhead.
export const secureStorage: StateStorage =
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

// AsyncStorage ships its own web implementation (backed by localStorage), so no
// Platform branch is needed here like there is for secureStorage above.
export const plainStorage: StateStorage = AsyncStorage;

/**
 * @deprecated Use `secureStorage` (tokens) or `plainStorage` (everything else) instead —
 * this name doesn't say which one a given piece of state actually needs. Kept only so
 * any code that still imports it keeps working.
 */
export const persistedStorage = secureStorage;
