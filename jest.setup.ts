// Official mocks shipped by each package — closest thing to the real behavior.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('@react-native-community/netinfo', () => require('@react-native-community/netinfo/jest/netinfo-mock'));

// expo-secure-store has no official Jest mock — back it with an in-memory Map so
// anything that persists through it (authStore's access token) behaves like real
// storage within a single test run, without touching a real keychain.
jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    getItemAsync: jest.fn(async (key: string) => store.get(key) ?? null),
    setItemAsync: jest.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
    deleteItemAsync: jest.fn(async (key: string) => {
      store.delete(key);
    }),
  };
});

// Not used directly anywhere in src/ yet, but mocked defensively per task E1 — nothing
// imports device locale info during these tests, so a static vi-VN default is enough.
jest.mock('expo-localization', () => ({
  getLocales: () => [
    { languageTag: 'vi-VN', languageCode: 'vi', regionCode: 'VN', currencyCode: 'VND' },
  ],
  getCalendars: () => [{ calendar: 'gregory', timeZone: 'Asia/Ho_Chi_Minh' }],
  locale: 'vi-VN',
}));
