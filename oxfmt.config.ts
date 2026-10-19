import { defineConfig } from 'oxfmt';
import ultracite from 'ultracite/oxfmt';

export default defineConfig({
  ...ultracite,
  ignorePatterns: [...ultracite.ignorePatterns, 'test-results/**', 'playwright-report/**'],
  printWidth: 100,
  singleQuote: true,
  sortImports: false,
  trailingComma: 'all',
});
