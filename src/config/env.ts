const DEFAULT_API_URL = 'http://localhost:3000/api/v1';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL;
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '';
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? '';
// Same public site key as the web frontend (VITE_TURNSTILE_SITE_KEY).
const TURNSTILE_SITE_KEY = process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY ?? '';
// Hostname Cloudflare reports for the WebView page; must be in the backend's TURNSTILE_ALLOWED_HOSTNAMES.
const TURNSTILE_BASE_URL = process.env.EXPO_PUBLIC_TURNSTILE_BASE_URL ?? 'http://localhost';

// A build is misconfigured when it's NOT a local dev run (__DEV__ false — e.g. an EAS
// preview/production build) but EXPO_PUBLIC_API_URL still points at a dev-only host.
// Those hosts only resolve on the machine/emulator that built the app, so a real device
// running the built APK would silently fail every request without this check.
const DEV_ONLY_HOSTS = ['localhost', '127.0.0.1', '10.0.2.2'];
const isMisconfigured = !__DEV__ && DEV_ONLY_HOSTS.some((host) => API_URL.includes(host));

/** Grouped env access — prefer this for new code. Named exports below are kept for callers already using them. */
export const ENV = {
  API_URL,
  GOOGLE_WEB_CLIENT_ID,
  GOOGLE_IOS_CLIENT_ID,
  GOOGLE_ANDROID_CLIENT_ID,
  TURNSTILE_SITE_KEY,
  TURNSTILE_BASE_URL,
  isMisconfigured,
};

export {
  API_URL,
  GOOGLE_WEB_CLIENT_ID,
  GOOGLE_IOS_CLIENT_ID,
  GOOGLE_ANDROID_CLIENT_ID,
  TURNSTILE_SITE_KEY,
  TURNSTILE_BASE_URL,
  isMisconfigured,
};
