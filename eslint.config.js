
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import globals from 'globals';

export default tseslint.config(
  // Vendored AI-tool skill bundles and research clones are not app code.
  { ignores: ['dist/**', 'node_modules/**', 'android/**', 'docs/**', 'public/**', '_research/**', '.claude/**', '.opencode/**', '.pi/**', '.rovodev/**', '.vibe/**', '.kiro/**', '.gemini/**', '.hermes/**', '.qoder/**', '.agent/**', '.impeccable/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y
    },
    languageOptions: {
      globals: { ...globals.browser }
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,
      // TS handles undefined globals itself - core no-undef false-positives on
      // every JSX/global reference in .ts/.tsx (typescript-eslint requirement).
      'no-undef': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'off'
    }
  },
  // Build/content scripts run under Node, not the browser.
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      globals: { ...globals.node }
    }
  }
);
