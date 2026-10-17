import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { plainStorage, secureStorage } from '@/store/persistedStorage';
import { User } from '@/types/auth';

// The access token lives on its own in SecureStore — everything else here (user,
// hasSeenOnboarding) persists in plainStorage via the `persist` middleware below.
const ACCESS_TOKEN_KEY = 'smartstay-access-token';
// Where the whole state (including the token) used to live, back when this store
// persisted everything to SecureStore in one blob — read once to migrate a token
// out of it so an already-signed-in guest isn't logged out by this change.
const LEGACY_AUTH_KEY = 'smartstay-auth';

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

type LegacyAuthState = { accessToken?: string | null; user?: User | null; hasSeenOnboarding?: boolean };

// Runs at most once ever per install: deletes LEGACY_AUTH_KEY once read, so every
// later launch short-circuits on the `!legacyRaw` check below.
async function migrateFromLegacyBlob(): Promise<LegacyAuthState | null> {
  const legacyRaw = await secureStorage.getItem(LEGACY_AUTH_KEY);
  if (!legacyRaw) return null;

  let legacy: LegacyAuthState | null = null;
  try {
    legacy = JSON.parse(legacyRaw)?.state ?? null;
  } catch {
    legacy = null;
  }
  if (legacy?.accessToken) await secureStorage.setItem(ACCESS_TOKEN_KEY, legacy.accessToken);
  await secureStorage.removeItem(LEGACY_AUTH_KEY);
  return legacy;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      hasHydrated: false,
      hasSeenOnboarding: false,
      setSession: (accessToken, user) => {
        set({ accessToken, user });
        secureStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      },
      setAccessToken: (accessToken) => {
        set({ accessToken });
        secureStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      },
      updateUser: (user) => set({ user }),
      clearSession: () => {
        set({ accessToken: null, user: null });
        secureStorage.removeItem(ACCESS_TOKEN_KEY);
      },
      setHasHydrated: (value) => set({ hasHydrated: value }),
      setHasSeenOnboarding: (value) => set({ hasSeenOnboarding: value }),
    }),
    {
      name: 'smartstay-auth',
      storage: createJSONStorage(() => plainStorage),
      // accessToken is NOT in this blob — it's read from SecureStore separately below,
      // once plainStorage's own (faster) rehydration of the rest has landed.
      partialize: (state) => ({
        user: state.user,
        hasSeenOnboarding: state.hasSeenOnboarding,
      }),
      onRehydrateStorage: () => (state) => {
        (async () => {
          const token = await secureStorage.getItem(ACCESS_TOKEN_KEY);
          if (token) {
            useAuthStore.setState({ accessToken: token });
            return;
          }
          // No token under the new key — either a fresh install (nothing to migrate)
          // or the very first launch after this change, with everything still sitting
          // in the old combined SecureStore blob. Pull all three fields from it so
          // the guest stays signed in AND sees their own name immediately, not just
          // after the next GET /auth/me resolves.
          const legacy = await migrateFromLegacyBlob();
          if (legacy) {
            useAuthStore.setState({
              accessToken: legacy.accessToken ?? null,
              user: legacy.user ?? useAuthStore.getState().user,
              hasSeenOnboarding: legacy.hasSeenOnboarding ?? useAuthStore.getState().hasSeenOnboarding,
            });
          }
        })().finally(() => {
          // Only true once BOTH halves (plainStorage's user/hasSeenOnboarding, handled
          // by this callback firing at all, and SecureStore's token above) have loaded.
          state?.setHasHydrated(true);
        });
      },
    },
  ),
);
