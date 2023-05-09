module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react'],
  settings: {
    react: {
      version: 'detect',
    },
    componentWrapperFunctions: [
      {
        property: 'styled',
      },
    ],
  },
  rules: {
    // eslint overrides
    'no-use-before-define': 'off',
    // '@typescript-eslint/no-use-before-define': ['error'],
    'comma-dangle': ['error', 'always-multiline'],
    'import/no-anonymous-default-export': ['off'],
    'react/display-name': ['off'],
    'react/jsx-indent': [
      'error',
      2,
      {checkAttributes: true, indentLogicalExpressions: true},
    ],
    'react/jsx-indent-props': ['error', 2],
    'react/jsx-equals-spacing': ['error'],
    'react/jsx-fragments': ['error'],
    'react/jsx-key': ['error'],
    'react/jsx-tag-spacing': ['error'],
    'react/no-direct-mutation-state': ['error'],
    'react/no-this-in-sfc': ['error'],
    'react/no-unescaped-entities': ['off'],
    'react/prop-types': ['off'],
    'react/hook-use-state': ['error'],
    'no-undef': 'off', // to allow __DEV__ variable use
    '@typescript-eslint/ban-ts-comment': ['off'],
    '@typescript-eslint/no-unused-vars': ['off'],
    '@typescript-eslint/no-explicit-any': ['off'],
    '@typescript-eslint/no-empty-interface': ['off'],
  },
};
