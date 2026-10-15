const DEFAULT_API_URL = 'http://localhost:3000/api/v1';

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL;
export const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';
export const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '';
export const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? '';
// Same public site key as the web frontend (VITE_TURNSTILE_SITE_KEY).
export const TURNSTILE_SITE_KEY = process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY ?? '';
// Hostname Cloudflare reports for the WebView page; must be in the backend's TURNSTILE_ALLOWED_HOSTNAMES.
export const TURNSTILE_BASE_URL = process.env.EXPO_PUBLIC_TURNSTILE_BASE_URL ?? 'http://localhost';
