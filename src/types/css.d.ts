// `@/global.css` (imported for its side effect in src/constants/theme.ts) has no type
// declarations of its own. Normally `expo-env.d.ts` pulls in an ambient one via its
// `expo/types` reference, but that file is gitignored/auto-generated — a fresh checkout
// (e.g. CI running `npm ci` without ever running `expo start`) won't have it yet, and
// `tsc` would fail with TS2882 on the `.css` import. Declaring it here instead makes the
// type-check pass independent of that generated file.
declare module '*.css';
