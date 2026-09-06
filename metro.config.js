const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Some dependencies (e.g. zustand) ship an ESM build behind the "exports"
// field that references import.meta, which Metro's web bundle cannot
// execute as a classic script. Falling back to main/browser resolution
// avoids pulling in that ESM build.
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
