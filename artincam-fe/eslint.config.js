import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import importPlugin from 'eslint-plugin-import';
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // TypeScript rules that do NOT require type information
      ...tseslint.configs.recommended,
      // React hooks rules (optional but recommended)
      reactHooks.configs['recommended-latest'],
      // Vite React Fast Refresh rules
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: globals.browser,
    },
  },
])
