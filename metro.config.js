// Learn more: https://docs.expo.dev/guides/customizing-metro/
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// three >= r180 ships a deprecated CommonJS entry that calls
// `process.emitWarning`, which does not exist in React Native (Hermes).
// Always resolve `three` to its ES module build instead.
const threeModule = path.resolve(__dirname, 'node_modules/three/build/three.module.js');
const defaultResolve = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'three') {
    return { type: 'sourceFile', filePath: threeModule };
  }
  return defaultResolve ? defaultResolve(context, moduleName, platform) : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
