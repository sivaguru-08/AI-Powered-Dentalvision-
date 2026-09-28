// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', '.expo/*'],
  },
  {
    // react-three-fiber JSX uses three.js props (args, geometry, position, …)
    // that the DOM-oriented rule does not know about.
    files: ['src/components/three/**/*.tsx'],
    rules: { 'react/no-unknown-property': 'off' },
  },
]);
