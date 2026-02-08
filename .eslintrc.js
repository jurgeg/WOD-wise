module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  settings: {
    react: { version: 'detect' },
  },
  env: {
    es2022: true,
    node: true,
  },
  rules: {
    // React 19 doesn't require import React
    'react/react-in-jsx-scope': 'off',
    // Allow unused vars prefixed with _
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    // Ban non-null assertions (use optional chaining instead)
    '@typescript-eslint/no-non-null-assertion': 'warn',
    // Enforce exhaustive deps
    'react-hooks/exhaustive-deps': 'warn',
    // Allow require() for dynamic imports (expo-haptics lazy load)
    '@typescript-eslint/no-require-imports': 'off',
    // Allow explicit any in specific cases (RN style props)
    '@typescript-eslint/no-explicit-any': 'warn',
  },
  ignorePatterns: ['node_modules/', '.expo/', 'dist/', 'build/'],
};
