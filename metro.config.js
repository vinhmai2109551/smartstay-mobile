const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// zustand ships an ESM build behind the "exports" field that references
// import.meta, which Metro's web bundle cannot execute as a classic script.
// Fall back to main/browser resolution for zustand only — Expo's own packages
// (e.g. @expo/log-box/LogBox since SDK 58) resolve solely through "exports".
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const isZustand = moduleName === 'zustand' || moduleName.startsWith('zustand/');
  const ctx = isZustand ? { ...context, unstable_enablePackageExports: false } : context;
  return ctx.resolveRequest(ctx, moduleName, platform);
};

module.exports = config;
